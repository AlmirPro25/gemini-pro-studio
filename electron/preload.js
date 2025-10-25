/**
 * 🔒 ELECTRON PRELOAD - BRIDGE SEGURA
 * 
 * Expõe APIs do Electron para o renderer de forma segura
 */

const { contextBridge, ipcRenderer } = require('electron');

// API exposta para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Licença
  getLicense: () => ipcRenderer.invoke('get-license'),
  activateLicense: (key, type) => ipcRenderer.invoke('activate-license', key, type),
  checkFeature: (feature) => ipcRenderer.invoke('check-feature', feature),
  onLicenseInfo: (callback) => ipcRenderer.on('license-info', (event, data) => callback(data)),
  onOpenLicenseModal: (callback) => ipcRenderer.on('open-license-modal', () => callback()),

  // WhatsApp Bridge
  startWhatsAppBridge: () => ipcRenderer.invoke('start-whatsapp-bridge'),
  stopWhatsAppBridge: () => ipcRenderer.invoke('stop-whatsapp-bridge'),
  getWhatsAppBridgeStatus: () => ipcRenderer.invoke('whatsapp-bridge-status'),

  // Sistema
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Plataforma
  platform: process.platform,
  isElectron: true
});

console.log('🔒 Preload script carregado');
