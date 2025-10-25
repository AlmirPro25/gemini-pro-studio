#!/usr/bin/env node

/**
 * Script de validação do projeto
 * Verifica se todos os arquivos necessários existem e estão configurados corretamente
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function log(type, message) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  console.log(`${icons[type]} ${message}`);
}

function checkFileExists(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log('success', `${filePath} existe`);
    checks.passed++;
  } else if (required) {
    log('error', `${filePath} não encontrado`);
    checks.failed++;
  } else {
    log('warning', `${filePath} não encontrado (opcional)`);
    checks.warnings++;
  }
  return exists;
}

function checkEnvFile() {
  if (checkFileExists('.env.local', false)) {
    const content = fs.readFileSync('.env.local', 'utf8');
    if (content.includes('your_api_key_here') || !content.includes('GEMINI_API_KEY=')) {
      log('warning', 'API Key não configurada em .env.local');
      checks.warnings++;
    } else {
      log('success', 'API Key configurada');
      checks.passed++;
    }
  } else {
    log('warning', 'Arquivo .env.local não encontrado. Copie .env.example e configure sua API key');
    checks.warnings++;
  }
}

function checkPackageJson() {
  if (checkFileExists('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDeps = ['react', 'react-dom', '@google/genai', 'marked'];
    const requiredDevDeps = ['typescript', 'vite', '@vitejs/plugin-react', '@types/react'];
    
    requiredDeps.forEach(dep => {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        checks.passed++;
      } else {
        log('error', `Dependência faltando: ${dep}`);
        checks.failed++;
      }
    });
    
    requiredDevDeps.forEach(dep => {
      if (pkg.devDependencies && pkg.devDependencies[dep]) {
        checks.passed++;
      } else {
        log('error', `Dev dependency faltando: ${dep}`);
        checks.failed++;
      }
    });
  }
}

function checkSourceFiles() {
  const requiredFiles = [
    'src/App.tsx',
    'src/types.ts',
    'src/constants.ts',
    'src/services/geminiService.ts',
    'src/utils/storage.ts',
    'src/components/ErrorBoundary.tsx',
    'src/components/ChatView.tsx',
    'src/components/Message.tsx',
    'index.tsx',
    'index.html',
    'vite.config.ts',
    'tsconfig.json'
  ];
  
  requiredFiles.forEach(file => checkFileExists(file));
}

function checkDuplicates() {
  const shouldNotExist = [
    'App.tsx',
    'types.ts',
    'constants.ts',
    'components/ChatView.tsx',
    'services/geminiService.ts'
  ];
  
  shouldNotExist.forEach(file => {
    if (fs.existsSync(file)) {
      log('error', `Arquivo duplicado encontrado na raiz: ${file}`);
      checks.failed++;
    } else {
      checks.passed++;
    }
  });
}

console.log('\n🔍 Validando projeto Gemini Pro Studio...\n');

console.log('📁 Verificando estrutura de arquivos...');
checkSourceFiles();

console.log('\n🔄 Verificando duplicatas...');
checkDuplicates();

console.log('\n📦 Verificando dependências...');
checkPackageJson();

console.log('\n🔑 Verificando configuração...');
checkEnvFile();

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Resultado:`);
console.log(`   ✅ Passou: ${checks.passed}`);
console.log(`   ❌ Falhou: ${checks.failed}`);
console.log(`   ⚠️  Avisos: ${checks.warnings}`);

if (checks.failed > 0) {
  console.log('\n❌ Validação falhou! Corrija os erros acima.');
  process.exit(1);
} else if (checks.warnings > 0) {
  console.log('\n⚠️  Validação passou com avisos. Revise os avisos acima.');
  process.exit(0);
} else {
  console.log('\n✅ Validação passou! Projeto está pronto.');
  process.exit(0);
}
