# 🌟 PLANO COMPLETO - Dar Vida ao Sistema

## 📊 Análise Atual do Painel Admin

### ✅ O que JÁ está VIVO (funcionando):
1. **Dashboard**
   - ✅ Métricas reais do banco
   - ✅ Mensagens recentes reais
   - ✅ Contatos ativos reais
   - ✅ Botão atualizar funcionando
   - ✅ Ações rápidas funcionais

2. **CRM**
   - ✅ Lista de contatos do banco
   - ⚠️ Filtros não funcionam
   - ⚠️ Botão "Novo Cliente" não faz nada
   - ⚠️ Tags vazias
   - ⚠️ Total gasto sempre R$ 0

3. **Agentes IA**
   - ⚠️ Dados hardcoded (fake)
   - ⚠️ Toggle não funciona
   - ⚠️ Botões não fazem nada
   - ⚠️ Não salva no banco

### ❌ O que está MORTO (precisa dar vida):

1. **Vendas** - Tela vazia "Em desenvolvimento"
2. **Automações** - Tela vazia "Em desenvolvimento"
3. **Equipe** - Tela vazia "Em desenvolvimento"

---

## 🎯 PLANO DE AÇÃO - Fase por Fase

### FASE 1: CRM Completo e Funcional ✅

#### 1.1 Expandir Banco de Dados
```sql
-- Adicionar tabelas no SQLite (whatsapp-bridge/database.js)

CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    status TEXT DEFAULT 'lead',
    total_spent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_contact_at DATETIME,
    notes TEXT
);

CREATE TABLE customer_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE customer_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

#### 1.2 Funcionalidades CRM
- [ ] Criar novo cliente
- [ ] Editar cliente
- [ ] Adicionar tags
- [ ] Filtrar por status (lead/customer/vip)
- [ ] Buscar clientes
- [ ] Ver histórico de interações
- [ ] Adicionar notas
- [ ] Calcular total gasto

---

### FASE 2: Agentes IA Funcionais 🤖

#### 2.1 Expandir Banco de Dados
```sql
CREATE TABLE ai_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    conversations INTEGER DEFAULT 0,
    satisfaction REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    customer_phone TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    satisfaction_rating INTEGER,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
);
```

#### 2.2 Funcionalidades Agentes
- [ ] Criar novo agente
- [ ] Editar agente
- [ ] Ativar/desativar agente
- [ ] Atribuir agente a conversas
- [ ] Rastrear conversas por agente
- [ ] Calcular satisfação
- [ ] Ver estatísticas por agente

---

### FASE 3: Sistema de Vendas 💰

#### 3.1 Expandir Banco de Dados
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    sold INTEGER DEFAULT 0,
    image_url TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    delivered_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### 3.2 Funcionalidades Vendas
- [ ] Cadastrar produtos
- [ ] Criar venda
- [ ] Adicionar itens à venda
- [ ] Processar pagamento
- [ ] Atualizar status (pendente/pago/entregue)
- [ ] Gerar relatório de vendas
- [ ] Dashboard de vendas
- [ ] Produtos mais vendidos

---

### FASE 4: Automações ⚡

#### 4.1 Expandir Banco de Dados
```sql
CREATE TABLE automations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_value TEXT,
    action_type TEXT NOT NULL,
    action_value TEXT,
    active INTEGER DEFAULT 1,
    executions INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE automation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_id INTEGER NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    FOREIGN KEY (automation_id) REFERENCES automations(id)
);
```

#### 4.2 Tipos de Automações
- [ ] **Boas-vindas**: Mensagem automática para novos contatos
- [ ] **Follow-up**: Mensagem após X dias sem resposta
- [ ] **Aniversário**: Mensagem no aniversário do cliente
- [ ] **Carrinho abandonado**: Lembrete de compra não finalizada
- [ ] **Pós-venda**: Pesquisa de satisfação após compra
- [ ] **Promoções**: Envio automático de ofertas
- [ ] **Lembretes**: Agendamento de mensagens

---

### FASE 5: Gestão de Equipe 👥

#### 5.1 Expandir Banco de Dados
```sql
CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES team_members(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE team_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    date DATE NOT NULL,
    conversations INTEGER DEFAULT 0,
    sales REAL DEFAULT 0,
    satisfaction REAL DEFAULT 0,
    FOREIGN KEY (member_id) REFERENCES team_members(id)
);
```

#### 5.2 Funcionalidades Equipe
- [ ] Adicionar membro
- [ ] Atribuir clientes a membros
- [ ] Ver performance individual
- [ ] Ranking de vendedores
- [ ] Metas e objetivos
- [ ] Comissões

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

### Semana 1: CRM Completo
**Dia 1-2:** Banco de dados + API
**Dia 3-4:** Interface CRM
**Dia 5:** Testes e ajustes

### Semana 2: Agentes IA
**Dia 1-2:** Banco de dados + API
**Dia 3-4:** Interface Agentes
**Dia 5:** Integração com WhatsApp

### Semana 3: Sistema de Vendas
**Dia 1-2:** Banco de dados + API
**Dia 3-4:** Interface Vendas
**Dia 5:** Relatórios e dashboard

### Semana 4: Automações
**Dia 1-2:** Banco de dados + Engine
**Dia 3-4:** Interface Automações
**Dia 5:** Testes de automações

### Semana 5: Gestão de Equipe
**Dia 1-2:** Banco de dados + API
**Dia 3-4:** Interface Equipe
**Dia 5:** Performance e relatórios

---

## 📋 CHECKLIST DETALHADO

### CRM
- [ ] Tabelas no banco
- [ ] API endpoints (CRUD)
- [ ] Criar cliente
- [ ] Editar cliente
- [ ] Deletar cliente
- [ ] Filtros funcionais
- [ ] Busca funcionando
- [ ] Tags funcionando
- [ ] Histórico de interações
- [ ] Notas
- [ ] Total gasto calculado

### Agentes IA
- [ ] Tabelas no banco
- [ ] API endpoints
- [ ] Criar agente
- [ ] Editar agente
- [ ] Ativar/desativar
- [ ] Atribuir a conversas
- [ ] Rastrear conversas
- [ ] Calcular satisfação
- [ ] Estatísticas

### Vendas
- [ ] Tabelas no banco
- [ ] API endpoints
- [ ] Cadastrar produtos
- [ ] Criar venda
- [ ] Processar pagamento
- [ ] Atualizar status
- [ ] Relatórios
- [ ] Dashboard

### Automações
- [ ] Tabelas no banco
- [ ] Engine de automações
- [ ] Criar automação
- [ ] Editar automação
- [ ] Ativar/desativar
- [ ] Logs de execução
- [ ] Tipos de triggers
- [ ] Tipos de ações

### Equipe
- [ ] Tabelas no banco
- [ ] API endpoints
- [ ] Adicionar membro
- [ ] Atribuir clientes
- [ ] Performance
- [ ] Ranking
- [ ] Metas
- [ ] Comissões

---

## 🎯 PRIORIDADES

### 🔴 URGENTE (Fazer AGORA)
1. ✅ CRM - Filtros funcionais
2. ✅ CRM - Criar/Editar cliente
3. ✅ CRM - Tags funcionando

### 🟠 IMPORTANTE (Esta Semana)
4. ✅ Agentes IA - Salvar no banco
5. ✅ Agentes IA - CRUD completo
6. ✅ Vendas - Estrutura básica

### 🟡 MÉDIO (Próxima Semana)
7. ✅ Vendas - Produtos e vendas
8. ✅ Automações - Estrutura básica
9. ✅ Equipe - Estrutura básica

### 🟢 BAIXO (Futuro)
10. ✅ Relatórios avançados
11. ✅ Analytics
12. ✅ Integrações extras

---

## 💡 PRÓXIMO PASSO IMEDIATO

**Vamos começar pelo CRM!**

1. Criar tabelas no banco (5 min)
2. Criar API endpoints (10 min)
3. Conectar interface (10 min)
4. Testar (5 min)

**Total: 30 minutos para CRM funcional!**

Quer que eu comece agora? 🚀
