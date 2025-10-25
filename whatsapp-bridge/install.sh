#!/bin/bash

# 📱 Script de Instalação Rápida - WhatsApp Bridge

echo "🚀 Instalando WhatsApp Bridge..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${BLUE}Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js não encontrado. Instale Node.js 18+ primeiro.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Node.js versão 18+ necessária. Versão atual: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) encontrado${NC}"
echo ""

# Instalar dependências
echo -e "${BLUE}Instalando dependências...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Erro ao instalar dependências${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependências instaladas${NC}"
echo ""

# Criar .env se não existir
if [ ! -f .env ]; then
    echo -e "${BLUE}Criando arquivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Arquivo .env criado${NC}"
    echo -e "${YELLOW}⚠️  Configure sua GEMINI_API_KEY no arquivo .env${NC}"
else
    echo -e "${GREEN}✓ Arquivo .env já existe${NC}"
fi

echo ""
echo -e "${GREEN}✅ Instalação concluída!${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Configure sua API key no arquivo .env"
echo "2. Execute: npm start"
echo "3. Escaneie o QR Code com seu WhatsApp"
echo ""
echo -e "${GREEN}Pronto para usar! 🎉${NC}"
