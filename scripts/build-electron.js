/**
 * 🏗️ SCRIPT DE BUILD AUTOMATIZADO
 * 
 * Compila o app Vite e cria os instaladores Electron
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build do Gemini Pro Studio...\n');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, cwd = process.cwd()) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`❌ Erro ao executar: ${command}`, 'red');
    return false;
  }
}

// Passo 1: Build do Vite
log('📦 Passo 1: Compilando aplicação web (Vite)...', 'blue');
if (!exec('npm run build')) {
  log('❌ Falha no build do Vite', 'red');
  process.exit(1);
}
log('✅ Build do Vite concluído!\n', 'green');

// Passo 2: Verificar dist
if (!fs.existsSync('dist')) {
  log('❌ Pasta dist não encontrada!', 'red');
  process.exit(1);
}

// Passo 3: Instalar dependências do Electron (se necessário)
const electronPath = path.join(process.cwd(), 'electron');
if (!fs.existsSync(path.join(electronPath, 'node_modules'))) {
  log('📦 Passo 2: Instalando dependências do Electron...', 'blue');
  if (!exec('npm install', electronPath)) {
    log('❌ Falha ao instalar dependências', 'red');
    process.exit(1);
  }
  log('✅ Dependências instaladas!\n', 'green');
}

// Passo 4: Build do Electron
log('🖥️  Passo 3: Criando instaladores...', 'blue');
log('Isso pode levar alguns minutos...\n', 'yellow');

const platform = process.platform;
let buildCommand = 'npm run build';

if (process.argv.includes('--win')) {
  buildCommand = 'npm run build:win';
  log('🪟 Compilando para Windows...', 'blue');
} else if (process.argv.includes('--mac')) {
  buildCommand = 'npm run build:mac';
  log('🍎 Compilando para macOS...', 'blue');
} else if (process.argv.includes('--linux')) {
  buildCommand = 'npm run build:linux';
  log('🐧 Compilando para Linux...', 'blue');
} else {
  log(`🖥️  Compilando para ${platform}...`, 'blue');
}

if (!exec(buildCommand, electronPath)) {
  log('❌ Falha no build do Electron', 'red');
  process.exit(1);
}

log('\n✅ Build concluído com sucesso!', 'green');

// Passo 5: Mostrar arquivos gerados
const distElectronPath = path.join(electronPath, 'dist-electron');
if (fs.existsSync(distElectronPath)) {
  log('\n📦 Instaladores gerados:', 'blue');
  const files = fs.readdirSync(distElectronPath);
  files.forEach(file => {
    const stats = fs.statSync(path.join(distElectronPath, file));
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    log(`   - ${file} (${sizeMB} MB)`, 'green');
  });
}

log('\n🎉 Pronto para distribuir!', 'green');
log('\n📍 Localização:', 'blue');
log(`   ${distElectronPath}\n`, 'yellow');

// Instruções
log('📝 Próximos passos:', 'blue');
log('   1. Teste o instalador', 'yellow');
log('   2. Faça upload para GitHub Releases', 'yellow');
log('   3. Ou hospede em seu servidor', 'yellow');
log('   4. Compartilhe com o mundo! 🚀\n', 'yellow');
