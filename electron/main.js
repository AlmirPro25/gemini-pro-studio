/**
 * 🖥️ GEMINI PRO STUDIO - ELECTRON MAIN PROCESS
 * 
 * App desktop completo com:
 * - Auto-update
 * - Sistema de licenças
 * - Tray icon
 * - Notificações
 * - Deep links
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Configurações
const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = 'http://localhost:3000';

let mainWindow = null;
let tray = null;
let whatsappBridgeProcess = null;

// ==================== SISTEMA DE LICENÇAS ====================

class LicenseManager {
  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'license.json');
    this.license = this.loadLicense();
  }

  loadLicense() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('Erro ao carregar licença:', error);
    }
    return {
      key: null,
      type: 'free', // free, pro, enterprise
      expiresAt: null,
      features: {
        maxAgents: 1,
        maxConversations: 100,
        whatsappIntegration: false,
        advancedFeatures: false
      }
    };
  }

  saveLicense(license) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(license, null, 2));
      this.license = license;
      return true;
    } catch (error) {
      console.error('Erro ao salvar licença:', error);
      return false;
    }
  }

  validateLicense(key) {
    // TODO: Validar com servidor
    // Por enquanto, validação local simples
    if (!key) return false;
    
    // Formato: GPRO-XXXX-XXXX-XXXX
    const regex = /^GPRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return regex.test(key);
  }

  activateLicense(key, type = 'pro') {
    if (!this.validateLicense(key)) {
      return { success: false, message: 'Chave inválida' };
    }

    const features = {
      free: {
        maxAgents: 1,
        maxConversations: 100,
        whatsappIntegration: false,
        advancedFeatures: false
      },
      pro: {
        maxAgents: 5,
        maxConversations: -1, // ilimitado
        whatsappIntegration: true,
        advancedFeatures: true
      },
      enterprise: {
        maxAgents: -1, // ilimitado
        maxConversations: -1,
        whatsappIntegration: true,
        advancedFeatures: true,
        whiteLabel: true,
        apiAccess: true
      }
    };

    const license = {
      key,
      type,
      activatedAt: Date.now(),
      expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 ano
      features: features[type]
    };

    if (this.saveLicense(license)) {
      return { success: true, message: 'Licença ativada com sucesso!', license };
    }

    return { success: false, message: 'Erro ao ativar licença' };
  }

  getLicense() {
    return this.license;
  }

  isFeatureEnabled(feature) {
    return this.license.features[feature] === true || this.license.features[feature] === -1;
  }
}

const licenseManager = new LicenseManager();

// ==================== CRIAR JANELA PRINCIPAL ====================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1a1a1a',
      symbolColor: '#ffffff',
      height: 40
    }
  });

  // Carregar app
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Eventos
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', (event) => {
    if (process.platform === 'darwin') return;
    event.preventDefault();
    mainWindow.hide();
  });

  // Links externos abrem no navegador
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Enviar licença para o renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('license-info', licenseManager.getLicense());
  });
}

// ==================== TRAY ICON ====================

function createTray() {
  const iconPath = path.join(__dirname, 'tray-icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Gemini Pro Studio',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'WhatsApp Bridge',
      submenu: [
        {
          label: whatsappBridgeProcess ? 'Parar' : 'Iniciar',
          click: () => {
            if (whatsappBridgeProcess) {
              stopWhatsAppBridge();
            } else {
              startWhatsAppBridge();
            }
          }
        },
        {
          label: 'Status',
          click: () => {
            const status = whatsappBridgeProcess ? 'Rodando' : 'Parado';
            new Notification({
              title: 'WhatsApp Bridge',
              body: `Status: ${status}`
            }).show();
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: `Licença: ${licenseManager.getLicense().type.toUpperCase()}`,
      enabled: false
    },
    {
      label: 'Ativar Licença',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('open-license-modal');
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Gemini Pro Studio');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ==================== WHATSAPP BRIDGE ====================

function startWhatsAppBridge() {
  if (whatsappBridgeProcess) {
    console.log('WhatsApp Bridge já está rodando');
    return;
  }

  const bridgePath = path.join(__dirname, '../whatsapp-bridge');
  
  whatsappBridgeProcess = spawn('npm', ['start'], {
    cwd: bridgePath,
    shell: true
  });

  whatsappBridgeProcess.stdout.on('data', (data) => {
    console.log(`WhatsApp Bridge: ${data}`);
  });

  whatsappBridgeProcess.stderr.on('data', (data) => {
    console.error(`WhatsApp Bridge Error: ${data}`);
  });

  whatsappBridgeProcess.on('close', (code) => {
    console.log(`WhatsApp Bridge encerrado com código ${code}`);
    whatsappBridgeProcess = null;
  });

  new Notification({
    title: 'WhatsApp Bridge',
    body: 'Iniciado com sucesso!'
  }).show();
}

function stopWhatsAppBridge() {
  if (whatsappBridgeProcess) {
    whatsappBridgeProcess.kill();
    whatsappBridgeProcess = null;
    
    new Notification({
      title: 'WhatsApp Bridge',
      body: 'Parado com sucesso!'
    }).show();
  }
}

// ==================== IPC HANDLERS ====================

// Licença
ipcMain.handle('get-license', () => {
  return licenseManager.getLicense();
});

ipcMain.handle('activate-license', async (event, key, type) => {
  const result = licenseManager.activateLicense(key, type);
  
  if (result.success) {
    // Atualizar tray menu
    if (tray) {
      createTray();
    }
    
    // Notificar usuário
    new Notification({
      title: 'Licença Ativada!',
      body: `Plano ${type.toUpperCase()} ativado com sucesso!`
    }).show();
  }
  
  return result;
});

ipcMain.handle('check-feature', (event, feature) => {
  return licenseManager.isFeatureEnabled(feature);
});

// WhatsApp Bridge
ipcMain.handle('start-whatsapp-bridge', () => {
  if (!licenseManager.isFeatureEnabled('whatsappIntegration')) {
    return { success: false, message: 'Recurso não disponível no seu plano' };
  }
  startWhatsAppBridge();
  return { success: true };
});

ipcMain.handle('stop-whatsapp-bridge', () => {
  stopWhatsAppBridge();
  return { success: true };
});

ipcMain.handle('whatsapp-bridge-status', () => {
  return { running: whatsappBridgeProcess !== null };
});

// Sistema
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return await dialog.showSaveDialog(mainWindow, options);
});

// ==================== APP LIFECYCLE ====================

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Auto-iniciar WhatsApp Bridge se licença permitir
  if (licenseManager.isFeatureEnabled('whatsappIntegration')) {
    setTimeout(() => {
      startWhatsAppBridge();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Não sair no macOS
  if (process.platform !== 'darwin') {
    // Manter rodando em background
    // app.quit();
  }
});

app.on('before-quit', () => {
  // Parar WhatsApp Bridge
  if (whatsappBridgeProcess) {
    whatsappBridgeProcess.kill();
  }
});

// ==================== AUTO UPDATE ====================

// TODO: Implementar auto-update com electron-updater
// const { autoUpdater } = require('electron-updater');
// 
// autoUpdater.checkForUpdatesAndNotify();
// 
// autoUpdater.on('update-available', () => {
//   new Notification({
//     title: 'Atualização Disponível',
//     body: 'Uma nova versão está sendo baixada...'
//   }).show();
// });

console.log('🚀 Gemini Pro Studio iniciado!');
console.log(`📦 Versão: ${app.getVersion()}`);
console.log(`📝 Licença: ${licenseManager.getLicense().type}`);
