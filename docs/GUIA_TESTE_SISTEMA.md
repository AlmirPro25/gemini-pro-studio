# 🧪 GUIA DE TESTE DO SISTEMA

## ✅ SISTEMA RODANDO!

**URL:** http://localhost:3000/  
**Status:** ✅ Online  
**API Key:** ✅ Configurada

---

## 🎯 CHECKLIST DE TESTES

### 1. 💬 CHAT COM IA (Básico)

**Testes:**
- [ ] Abrir o sistema no navegador
- [ ] Enviar mensagem simples: "Olá, como você está?"
- [ ] Verificar resposta da IA
- [ ] Testar sugestões de prompts
- [ ] Verificar histórico de mensagens

**Comandos para testar:**
```
1. "Olá, me explique o que você pode fazer"
2. "Crie um código Python para calcular fibonacci"
3. "Me conte uma história curta"
```

---

### 2. 🎭 PERSONAS

**Testes:**
- [ ] Clicar no seletor de personas (canto superior)
- [ ] Trocar para "Code Expert"
- [ ] Pedir: "Crie uma função JavaScript para validar email"
- [ ] Trocar para "Creative Writer"
- [ ] Pedir: "Escreva um poema sobre tecnologia"

**Personas disponíveis:**
1. Gemini (Geral)
2. Code Expert
3. Creative Writer
4. Business Consultant
5. UI/UX Designer
6. Marketing Specialist
7. Security Architect
8. Scalability Expert
9. Payment Integrator
10. AI & ML Architect

---

### 3. 🧠 MODO THINKING

**Testes:**
- [ ] Ativar toggle "Thinking Mode"
- [ ] Perguntar: "Como resolver o problema P vs NP?"
- [ ] Verificar raciocínio passo a passo
- [ ] Desativar modo thinking

---

### 4. 🎨 GERAÇÃO DE IMAGENS

**Testes:**
- [ ] Trocar modelo para "Flash 2.0 Experimental (GRÁTIS)"
- [ ] Enviar: "um gato astronauta no espaço"
- [ ] Aguardar geração (5-10s)
- [ ] Verificar imagem gerada
- [ ] Clicar na imagem para ampliar

**Prompts para testar:**
```
1. "um robô futurista em uma cidade cyberpunk"
2. "paisagem montanhosa ao pôr do sol"
3. "cachorro golden retriever brincando na praia"
```

---

### 5. 📸 ANÁLISE DE IMAGENS

**Testes:**
- [ ] Voltar para modelo "Gemini 2.5 Flash"
- [ ] Clicar no ícone de anexo (📎)
- [ ] Selecionar uma imagem do seu computador
- [ ] Perguntar: "O que tem nesta imagem?"
- [ ] Verificar análise detalhada

---

### 6. 🖼️ GALERIA DE IMAGENS

**Testes:**
- [ ] Clicar em "Galeria" no menu lateral
- [ ] Verificar imagens geradas anteriormente
- [ ] Clicar em uma imagem para visualizar
- [ ] Verificar prompt usado
- [ ] Testar download da imagem

---

### 7. 📄 GERADOR DE DOCUMENTOS

**Testes:**
- [ ] Clicar em "Documentos" no menu lateral
- [ ] Selecionar "Currículo"
- [ ] Escolher template "Profissional Clássico"
- [ ] Preencher dados básicos
- [ ] Gerar documento
- [ ] Verificar formatação

**Tipos para testar:**
1. Currículo (6 templates)
2. Contrato de Locação
3. Declaração Simples
4. Proposta Comercial

---

### 8. 🤖 CRM - GESTÃO DE CLIENTES

**Testes:**
- [ ] Abrir menu lateral
- [ ] Procurar seção "CRM" ou "Clientes"
- [ ] Clicar em "Novo Cliente"
- [ ] Preencher dados:
  - Nome: "João Silva"
  - Email: "joao@email.com"
  - Telefone: "(11) 98765-4321"
  - Empresa: "Tech Solutions"
  - Status: "Lead"
  - Valor: "R$ 5.000"
- [ ] Salvar cliente
- [ ] Verificar na lista
- [ ] Editar cliente
- [ ] Adicionar tags
- [ ] Adicionar nota

**Dashboard CRM:**
- [ ] Verificar total de clientes
- [ ] Ver distribuição por status
- [ ] Filtrar por tags
- [ ] Buscar cliente

---

### 9. 🤖 AGENTES IA

**Testes:**
- [ ] Abrir seção "Agentes IA"
- [ ] Criar novo agente:
  - Nome: "Follow-up Automático"
  - Objetivo: "Enviar mensagem após 3 dias sem contato"
  - Trigger: "Tempo sem contato"
  - Ação: "Enviar mensagem"
- [ ] Salvar agente
- [ ] Ativar agente
- [ ] Verificar na lista

**Agentes para testar:**
1. Qualificação de leads
2. Follow-up automático
3. Atualização de status
4. Notificação de vendas

---

### 10. ⚡ AUTOMAÇÕES

**Testes:**
- [ ] Abrir seção "Automações"
- [ ] Criar nova automação:
  - Nome: "Boas-vindas"
  - Trigger: "Novo cliente"
  - Condição: "Status = Cliente"
  - Ação: "Enviar email"
- [ ] Salvar automação
- [ ] Ativar automação
- [ ] Testar com novo cliente

**Automações para testar:**
1. Email de boas-vindas
2. WhatsApp automático
3. Atualização de CRM
4. Notificação para equipe

---

### 11. 👥 EQUIPE

**Testes:**
- [ ] Abrir seção "Equipe"
- [ ] Adicionar membro:
  - Nome: "Maria Santos"
  - Email: "maria@empresa.com"
  - Cargo: "Vendedora"
  - Departamento: "Vendas"
  - Meta mensal: "R$ 10.000"
  - Comissão: "5%"
- [ ] Salvar membro
- [ ] Verificar dashboard
- [ ] Adicionar desempenho mensal
- [ ] Ver métricas

**Métricas para verificar:**
- Total de membros
- Membros ativos
- Vendas do mês
- Comissões pagas
- Meta atingida

---

### 12. 📱 WHATSAPP (Opcional)

**Pré-requisito:** WhatsApp Bridge rodando

**Testes:**
- [ ] Abrir seção "WhatsApp"
- [ ] Verificar status da conexão
- [ ] Se desconectado, escanear QR Code
- [ ] Enviar mensagem de teste
- [ ] Receber resposta
- [ ] Verificar histórico

**Para iniciar WhatsApp Bridge:**
```bash
cd whatsapp-bridge
npm install
npm start
```

---

## 🐛 TESTES DE BUGS COMUNS

### Teste 1: Histórico de Chat
- [ ] Criar novo chat
- [ ] Enviar várias mensagens
- [ ] Recarregar página (F5)
- [ ] Verificar se histórico foi mantido

### Teste 2: Troca de Modelo
- [ ] Enviar mensagem com Gemini 2.5 Flash
- [ ] Trocar para Gemini 2.5 Pro
- [ ] Enviar outra mensagem
- [ ] Verificar se funcionou

### Teste 3: Anexos Múltiplos
- [ ] Anexar 2-3 imagens
- [ ] Enviar com prompt
- [ ] Verificar se todas foram processadas

### Teste 4: Código Interativo
- [ ] Pedir: "Crie um botão HTML interativo"
- [ ] Verificar se código aparece
- [ ] Testar preview
- [ ] Testar abrir em nova aba

### Teste 5: Regenerar Resposta
- [ ] Enviar mensagem
- [ ] Clicar em "Regenerar"
- [ ] Verificar nova resposta

---

## 🔍 TESTES DE PERFORMANCE

### Teste 1: Streaming
- [ ] Enviar pergunta longa
- [ ] Verificar se resposta aparece palavra por palavra
- [ ] Testar botão "Parar geração"

### Teste 2: Múltiplas Imagens
- [ ] Gerar 5 imagens seguidas
- [ ] Verificar se todas aparecem na galeria
- [ ] Verificar uso de memória

### Teste 3: Chat Longo
- [ ] Criar conversa com 20+ mensagens
- [ ] Verificar scroll
- [ ] Verificar performance

---

## 📊 TESTES DE DADOS

### Teste 1: Backup Automático
- [ ] Adicionar vários clientes
- [ ] Aguardar 1 minuto
- [ ] Abrir DevTools → Application → IndexedDB
- [ ] Verificar dados salvos

### Teste 2: Export de Dados
- [ ] Criar alguns dados
- [ ] Exportar backup
- [ ] Limpar dados
- [ ] Importar backup
- [ ] Verificar se voltou

### Teste 3: Sincronização
- [ ] Adicionar cliente no CRM
- [ ] Criar automação relacionada
- [ ] Verificar se integração funciona

---

## 🎨 TESTES DE INTERFACE

### Teste 1: Responsividade
- [ ] Redimensionar janela
- [ ] Testar em tela pequena
- [ ] Verificar menu mobile
- [ ] Testar sidebar

### Teste 2: Tema Dark/Light
- [ ] Trocar tema
- [ ] Verificar contraste
- [ ] Verificar todos os componentes

### Teste 3: Acessibilidade
- [ ] Navegar com Tab
- [ ] Testar atalhos de teclado
- [ ] Verificar labels

---

## 🚨 PROBLEMAS CONHECIDOS

### Se o sistema não carregar:
1. Verificar se porta 3000 está livre
2. Verificar API key no .env.local
3. Limpar cache do navegador (Ctrl+Shift+Del)
4. Verificar console do navegador (F12)

### Se imagens não gerarem:
1. Verificar modelo selecionado
2. Verificar API key
3. Verificar quota da API
4. Tentar modelo diferente

### Se WhatsApp não conectar:
1. Verificar se bridge está rodando
2. Verificar porta 3001
3. Escanear QR Code novamente
4. Verificar logs do bridge

---

## 📝 RELATÓRIO DE TESTES

Após testar, anote:

**Funcionalidades OK:** ✅
- Chat básico
- Personas
- Geração de imagens
- [adicione mais]

**Funcionalidades com Problemas:** ⚠️
- [descreva o problema]

**Bugs Encontrados:** 🐛
- [descreva o bug]

**Sugestões de Melhoria:** 💡
- [suas ideias]

---

## 🎯 PRÓXIMOS PASSOS

Após testar tudo:

1. **Adicionar dados reais** - Seus clientes, produtos, equipe
2. **Configurar automações** - Workflows do seu negócio
3. **Personalizar** - Ajustar para suas necessidades
4. **Treinar equipe** - Mostrar funcionalidades
5. **Usar em produção** - Começar a usar de verdade!

---

**Boa sorte nos testes!** 🚀

Se encontrar problemas, me avise que vamos corrigir juntos! 💪
