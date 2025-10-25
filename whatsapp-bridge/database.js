const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Criar pasta data se não existir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'whatsapp.db');
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Criar tabelas
db.exec(`
    -- Tabela de sessões WhatsApp
    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        phone_number TEXT,
        status TEXT DEFAULT 'disconnected',
        qr_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_connected_at DATETIME
    );

    -- Tabela de contatos
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT,
        profile_pic_url TEXT,
        is_group INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de mensagens
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE NOT NULL,
        session_id TEXT NOT NULL,
        from_number TEXT NOT NULL,
        to_number TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        content TEXT,
        media_url TEXT,
        media_mimetype TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent',
        is_from_me INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(session_id) ON DELETE CASCADE
    );

    -- Tabela de grupos
    CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de membros de grupos
    CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
        UNIQUE(group_id, phone_number)
    );

    -- Tabela de logs de eventos
    CREATE TABLE IF NOT EXISTS event_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        session_id TEXT,
        description TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de clientes (CRM)
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT,
        status TEXT DEFAULT 'lead',
        total_spent REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_contact_at DATETIME
    );

    -- Tabela de tags de clientes
    CREATE TABLE IF NOT EXISTS customer_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        tag TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- Tabela de interações com clientes
    CREATE TABLE IF NOT EXISTS customer_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- Tabela de agentes IA
    CREATE TABLE IF NOT EXISTS ai_agents (
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

    -- Tabela de conversas dos agentes
    CREATE TABLE IF NOT EXISTS agent_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        customer_phone TEXT NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        satisfaction_rating INTEGER,
        notes TEXT,
        FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE
    );

    -- Tabela de automações
    CREATE TABLE IF NOT EXISTS automations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        trigger_type TEXT NOT NULL,
        trigger_value TEXT,
        action_type TEXT NOT NULL,
        action_value TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        executions INTEGER DEFAULT 0,
        last_execution DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de logs de automações
    CREATE TABLE IF NOT EXISTS automation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        automation_id INTEGER NOT NULL,
        customer_phone TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        success INTEGER DEFAULT 1,
        error_message TEXT,
        FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
    );

    -- Tabela de produtos
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        sold INTEGER DEFAULT 0,
        category TEXT DEFAULT 'Outros',
        images TEXT,
        videos TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de vendas
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_phone TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME,
        delivered_at DATETIME
    );

    -- Tabela de itens da venda
    CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Tabela de membros da equipe
    CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        permissions TEXT NOT NULL,
        commission_rate REAL NOT NULL DEFAULT 0,
        monthly_goal REAL NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'active',
        hire_date DATE NOT NULL,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de performance da equipe
    CREATE TABLE IF NOT EXISTS team_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        sales_count INTEGER DEFAULT 0,
        revenue REAL DEFAULT 0,
        commission REAL DEFAULT 0,
        goal_completion REAL DEFAULT 0,
        rating INTEGER DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
        UNIQUE(member_id, month)
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_number);
    CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_number);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
    CREATE INDEX IF NOT EXISTS idx_event_logs_session ON event_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_event_logs_type ON event_logs(event_type);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
    CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
    CREATE INDEX IF NOT EXISTS idx_customer_tags_customer ON customer_tags(customer_id);
    CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON ai_agents(active);
    CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent ON agent_conversations(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agent_conversations_customer ON agent_conversations(customer_phone);
    CREATE INDEX IF NOT EXISTS idx_automations_active ON automations(active);
    CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations(trigger_type);
    CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_phone);
    CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
    CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
    CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
    CREATE INDEX IF NOT EXISTS idx_team_performance_member ON team_performance(member_id);
    CREATE INDEX IF NOT EXISTS idx_team_performance_month ON team_performance(month);
`);

// ==================== FUNÇÕES DE SESSÃO ====================

const saveSession = (sessionId, data) => {
    const stmt = db.prepare(`
        INSERT INTO whatsapp_sessions (session_id, phone_number, status, qr_code, last_connected_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(session_id) DO UPDATE SET
            phone_number = excluded.phone_number,
            status = excluded.status,
            qr_code = excluded.qr_code,
            updated_at = CURRENT_TIMESTAMP,
            last_connected_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(sessionId, data.phoneNumber || null, data.status || 'connected', data.qrCode || null);
};

const updateSessionStatus = (sessionId, status) => {
    const stmt = db.prepare(`
        UPDATE whatsapp_sessions 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
    `);
    return stmt.run(status, sessionId);
};

const getSession = (sessionId) => {
    const stmt = db.prepare('SELECT * FROM whatsapp_sessions WHERE session_id = ?');
    return stmt.get(sessionId);
};

const getAllSessions = () => {
    const stmt = db.prepare('SELECT * FROM whatsapp_sessions ORDER BY updated_at DESC');
    return stmt.all();
};

const deleteSession = (sessionId) => {
    const stmt = db.prepare('DELETE FROM whatsapp_sessions WHERE session_id = ?');
    return stmt.run(sessionId);
};

// ==================== FUNÇÕES DE MENSAGENS ====================

const saveMessage = (messageData) => {
    const stmt = db.prepare(`
        INSERT INTO messages (
            message_id, session_id, from_number, to_number, 
            message_type, content, media_url, media_mimetype, 
            timestamp, status, is_from_me
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(message_id) DO UPDATE SET
            status = excluded.status,
            content = excluded.content
    `);
    
    return stmt.run(
        messageData.messageId,
        messageData.sessionId,
        messageData.from,
        messageData.to,
        messageData.type || 'text',
        messageData.content || null,
        messageData.mediaUrl || null,
        messageData.mediaMimetype || null,
        messageData.timestamp || new Date().toISOString(),
        messageData.status || 'sent',
        messageData.isFromMe ? 1 : 0
    );
};

const getMessages = (sessionId, limit = 100, offset = 0) => {
    const stmt = db.prepare(`
        SELECT * FROM messages 
        WHERE session_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ? OFFSET ?
    `);
    return stmt.all(sessionId, limit, offset);
};

const getMessagesByContact = (sessionId, contactNumber, limit = 100) => {
    const stmt = db.prepare(`
        SELECT * FROM messages 
        WHERE session_id = ? 
        AND (from_number = ? OR to_number = ?)
        ORDER BY timestamp DESC 
        LIMIT ?
    `);
    return stmt.all(sessionId, contactNumber, contactNumber, limit);
};

const updateMessageStatus = (messageId, status) => {
    const stmt = db.prepare('UPDATE messages SET status = ? WHERE message_id = ?');
    return stmt.run(status, messageId);
};

// ==================== FUNÇÕES DE CONTATOS ====================

const saveContact = (contactData) => {
    const stmt = db.prepare(`
        INSERT INTO contacts (phone_number, name, profile_pic_url, is_group)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(phone_number) DO UPDATE SET
            name = excluded.name,
            profile_pic_url = excluded.profile_pic_url,
            updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(
        contactData.phoneNumber,
        contactData.name || null,
        contactData.profilePicUrl || null,
        contactData.isGroup ? 1 : 0
    );
};

const getContact = (phoneNumber) => {
    const stmt = db.prepare('SELECT * FROM contacts WHERE phone_number = ?');
    return stmt.get(phoneNumber);
};

const getAllContacts = () => {
    const stmt = db.prepare('SELECT * FROM contacts ORDER BY name ASC');
    return stmt.all();
};

// ==================== FUNÇÕES DE GRUPOS ====================

const saveGroup = (groupData) => {
    const stmt = db.prepare(`
        INSERT INTO groups (group_id, name, description)
        VALUES (?, ?, ?)
        ON CONFLICT(group_id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(groupData.groupId, groupData.name, groupData.description || null);
};

const addGroupMember = (groupId, phoneNumber, role = 'member') => {
    const stmt = db.prepare(`
        INSERT INTO group_members (group_id, phone_number, role)
        VALUES (?, ?, ?)
        ON CONFLICT(group_id, phone_number) DO UPDATE SET
            role = excluded.role
    `);
    return stmt.run(groupId, phoneNumber, role);
};

const getGroupMembers = (groupId) => {
    const stmt = db.prepare('SELECT * FROM group_members WHERE group_id = ?');
    return stmt.all(groupId);
};

// ==================== FUNÇÕES DE LOGS ====================

const logEvent = (eventType, sessionId, description, metadata = null) => {
    const stmt = db.prepare(`
        INSERT INTO event_logs (event_type, session_id, description, metadata)
        VALUES (?, ?, ?, ?)
    `);
    return stmt.run(
        eventType,
        sessionId || null,
        description,
        metadata ? JSON.stringify(metadata) : null
    );
};

const getEventLogs = (limit = 100, eventType = null) => {
    let query = 'SELECT * FROM event_logs';
    const params = [];
    
    if (eventType) {
        query += ' WHERE event_type = ?';
        params.push(eventType);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
};

// ==================== FUNÇÕES DE CLIENTES (CRM) ====================

const saveCustomer = (customerData) => {
  const stmt = db.prepare(`
    INSERT INTO customers (phone_number, name, email, status, total_spent, notes, last_contact_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(phone_number) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      status = excluded.status,
      total_spent = excluded.total_spent,
      notes = excluded.notes,
      last_contact_at = excluded.last_contact_at,
      updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(
    customerData.phoneNumber,
    customerData.name || null,
    customerData.email || null,
    customerData.status || 'lead',
    customerData.totalSpent || 0,
    customerData.notes || null,
    customerData.lastContactAt || new Date().toISOString()
  );
};

const getCustomer = (phoneNumber) => {
  const stmt = db.prepare('SELECT * FROM customers WHERE phone_number = ?');
  return stmt.get(phoneNumber);
};

const getAllCustomers = (status = null) => {
  let query = 'SELECT * FROM customers';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY updated_at DESC';
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const updateCustomerStatus = (phoneNumber, status) => {
  const stmt = db.prepare(`
    UPDATE customers 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE phone_number = ?
  `);
  return stmt.run(status, phoneNumber);
};

const addCustomerTag = (phoneNumber, tag) => {
  const customer = getCustomer(phoneNumber);
  if (!customer) return null;
  
  const stmt = db.prepare(`
    INSERT INTO customer_tags (customer_id, tag)
    VALUES (?, ?)
  `);
  return stmt.run(customer.id, tag);
};

const getCustomerTags = (phoneNumber) => {
  const customer = getCustomer(phoneNumber);
  if (!customer) return [];
  
  const stmt = db.prepare('SELECT tag FROM customer_tags WHERE customer_id = ?');
  return stmt.all(customer.id).map(row => row.tag);
};

const removeCustomerTag = (phoneNumber, tag) => {
  const customer = getCustomer(phoneNumber);
  if (!customer) return null;
  
  const stmt = db.prepare('DELETE FROM customer_tags WHERE customer_id = ? AND tag = ?');
  return stmt.run(customer.id, tag);
};

const addCustomerInteraction = (phoneNumber, type, description) => {
  const customer = getCustomer(phoneNumber);
  if (!customer) return null;
  
  const stmt = db.prepare(`
    INSERT INTO customer_interactions (customer_id, type, description)
    VALUES (?, ?, ?)
  `);
  return stmt.run(customer.id, type, description);
};

const getCustomerInteractions = (phoneNumber, limit = 50) => {
  const customer = getCustomer(phoneNumber);
  if (!customer) return [];
  
  const stmt = db.prepare(`
    SELECT * FROM customer_interactions 
    WHERE customer_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(customer.id, limit);
};

const searchCustomers = (searchTerm) => {
  const stmt = db.prepare(`
    SELECT * FROM customers 
    WHERE name LIKE ? OR phone_number LIKE ? OR email LIKE ?
    ORDER BY updated_at DESC
  `);
  const term = `%${searchTerm}%`;
  return stmt.all(term, term, term);
};

const deleteCustomer = (phoneNumber) => {
  const stmt = db.prepare('DELETE FROM customers WHERE phone_number = ?');
  return stmt.run(phoneNumber);
};

// ==================== FUNÇÕES DE AGENTES IA ====================

const saveAgent = (agentData) => {
  const stmt = db.prepare(`
    INSERT INTO ai_agents (name, type, prompt, active)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(
    agentData.name,
    agentData.type,
    agentData.prompt,
    agentData.active ? 1 : 0
  );
};

const updateAgent = (agentId, agentData) => {
  const stmt = db.prepare(`
    UPDATE ai_agents 
    SET name = ?, type = ?, prompt = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(
    agentData.name,
    agentData.type,
    agentData.prompt,
    agentData.active ? 1 : 0,
    agentId
  );
};

const getAgent = (agentId) => {
  const stmt = db.prepare('SELECT * FROM ai_agents WHERE id = ?');
  return stmt.get(agentId);
};

const getAllAgents = (activeOnly = false) => {
  let query = 'SELECT * FROM ai_agents';
  if (activeOnly) {
    query += ' WHERE active = 1';
  }
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  return stmt.all();
};

const toggleAgentStatus = (agentId) => {
  const agent = getAgent(agentId);
  if (!agent) return null;
  
  const stmt = db.prepare(`
    UPDATE ai_agents 
    SET active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(agent.active ? 0 : 1, agentId);
};

const deleteAgent = (agentId) => {
  const stmt = db.prepare('DELETE FROM ai_agents WHERE id = ?');
  return stmt.run(agentId);
};

const startAgentConversation = (agentId, customerPhone) => {
  const stmt = db.prepare(`
    INSERT INTO agent_conversations (agent_id, customer_phone)
    VALUES (?, ?)
  `);
  const result = stmt.run(agentId, customerPhone);
  
  // Incrementar contador de conversas
  const updateStmt = db.prepare(`
    UPDATE ai_agents 
    SET conversations = conversations + 1
    WHERE id = ?
  `);
  updateStmt.run(agentId);
  
  return result;
};

const endAgentConversation = (conversationId, satisfactionRating, notes) => {
  const stmt = db.prepare(`
    UPDATE agent_conversations 
    SET ended_at = CURRENT_TIMESTAMP, satisfaction_rating = ?, notes = ?
    WHERE id = ?
  `);
  const result = stmt.run(satisfactionRating, notes, conversationId);
  
  // Atualizar satisfação média do agente
  const conversation = db.prepare('SELECT agent_id FROM agent_conversations WHERE id = ?').get(conversationId);
  if (conversation) {
    const avgStmt = db.prepare(`
      SELECT AVG(satisfaction_rating) as avg_satisfaction
      FROM agent_conversations
      WHERE agent_id = ? AND satisfaction_rating IS NOT NULL
    `);
    const avg = avgStmt.get(conversation.agent_id);
    
    if (avg && avg.avg_satisfaction !== null) {
      const updateStmt = db.prepare(`
        UPDATE ai_agents 
        SET satisfaction = ?
        WHERE id = ?
      `);
      updateStmt.run(avg.avg_satisfaction, conversation.agent_id);
    }
  }
  
  return result;
};

const getAgentConversations = (agentId, limit = 50) => {
  const stmt = db.prepare(`
    SELECT * FROM agent_conversations 
    WHERE agent_id = ? 
    ORDER BY started_at DESC 
    LIMIT ?
  `);
  return stmt.all(agentId, limit);
};

const getAgentStats = (agentId) => {
  const agent = getAgent(agentId);
  if (!agent) return null;
  
  const totalConversations = db.prepare('SELECT COUNT(*) as count FROM agent_conversations WHERE agent_id = ?').get(agentId);
  const activeConversations = db.prepare('SELECT COUNT(*) as count FROM agent_conversations WHERE agent_id = ? AND ended_at IS NULL').get(agentId);
  const avgSatisfaction = db.prepare('SELECT AVG(satisfaction_rating) as avg FROM agent_conversations WHERE agent_id = ? AND satisfaction_rating IS NOT NULL').get(agentId);
  
  return {
    ...agent,
    totalConversations: totalConversations.count,
    activeConversations: activeConversations.count,
    avgSatisfaction: avgSatisfaction.avg || 0
  };
};

// ==================== FUNÇÕES DE AUTOMAÇÕES ====================

const saveAutomation = (automationData) => {
  const stmt = db.prepare(`
    INSERT INTO automations (name, description, trigger_type, trigger_value, action_type, action_value, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    automationData.name,
    automationData.description || null,
    automationData.triggerType,
    automationData.triggerValue || null,
    automationData.actionType,
    automationData.actionValue,
    automationData.active ? 1 : 0
  );
};

const updateAutomation = (automationId, automationData) => {
  const stmt = db.prepare(`
    UPDATE automations 
    SET name = ?, description = ?, trigger_type = ?, trigger_value = ?, 
        action_type = ?, action_value = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(
    automationData.name,
    automationData.description || null,
    automationData.triggerType,
    automationData.triggerValue || null,
    automationData.actionType,
    automationData.actionValue,
    automationData.active ? 1 : 0,
    automationId
  );
};

const getAutomation = (automationId) => {
  const stmt = db.prepare('SELECT * FROM automations WHERE id = ?');
  return stmt.get(automationId);
};

const getAllAutomations = (activeOnly = false) => {
  let query = 'SELECT * FROM automations';
  if (activeOnly) {
    query += ' WHERE active = 1';
  }
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  return stmt.all();
};

const toggleAutomationStatus = (automationId) => {
  const automation = getAutomation(automationId);
  if (!automation) return null;
  
  const stmt = db.prepare(`
    UPDATE automations 
    SET active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(automation.active ? 0 : 1, automationId);
};

const deleteAutomation = (automationId) => {
  const stmt = db.prepare('DELETE FROM automations WHERE id = ?');
  return stmt.run(automationId);
};

const logAutomationExecution = (automationId, customerPhone, success, errorMessage = null) => {
  const stmt = db.prepare(`
    INSERT INTO automation_logs (automation_id, customer_phone, success, error_message)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(automationId, customerPhone, success ? 1 : 0, errorMessage);
  
  // Atualizar contador de execuções
  const updateStmt = db.prepare(`
    UPDATE automations 
    SET executions = executions + 1, last_execution = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  updateStmt.run(automationId);
  
  return result;
};

const getAutomationLogs = (automationId, limit = 50) => {
  const stmt = db.prepare(`
    SELECT * FROM automation_logs 
    WHERE automation_id = ? 
    ORDER BY executed_at DESC 
    LIMIT ?
  `);
  return stmt.all(automationId, limit);
};

const getAutomationsByTrigger = (triggerType) => {
  const stmt = db.prepare(`
    SELECT * FROM automations 
    WHERE trigger_type = ? AND active = 1
    ORDER BY created_at ASC
  `);
  return stmt.all(triggerType);
};

const getAutomationStats = (automationId) => {
  const automation = getAutomation(automationId);
  if (!automation) return null;
  
  const successCount = db.prepare('SELECT COUNT(*) as count FROM automation_logs WHERE automation_id = ? AND success = 1').get(automationId);
  const failureCount = db.prepare('SELECT COUNT(*) as count FROM automation_logs WHERE automation_id = ? AND success = 0').get(automationId);
  const successRate = automation.executions > 0 ? (successCount.count / automation.executions * 100) : 0;
  
  return {
    ...automation,
    successCount: successCount.count,
    failureCount: failureCount.count,
    successRate: Math.round(successRate)
  };
};

// ==================== FUNÇÕES DE PRODUTOS ====================

const saveProduct = (productData) => {
  const stmt = db.prepare(`
    INSERT INTO products (name, description, price, stock, category, images, videos, active) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    productData.name,
    productData.description || null,
    productData.price,
    productData.stock || 0,
    productData.category || 'Outros',
    JSON.stringify(productData.images || []),
    JSON.stringify(productData.videos || []),
    productData.active ? 1 : 0
  );
};

const updateProduct = (productId, productData) => {
  const stmt = db.prepare(`
    UPDATE products SET 
      name = ?, 
      description = ?, 
      price = ?, 
      stock = ?, 
      category = ?,
      images = ?,
      videos = ?,
      active = ?, 
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  return stmt.run(
    productData.name,
    productData.description || null,
    productData.price,
    productData.stock || 0,
    productData.category || 'Outros',
    JSON.stringify(productData.images || []),
    JSON.stringify(productData.videos || []),
    productData.active ? 1 : 0,
    productId
  );
};

const getProduct = (productId) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (product) {
    product.images = JSON.parse(product.images || '[]');
    product.videos = JSON.parse(product.videos || '[]');
  }
  return product;
};

const getAllProducts = (activeOnly = false) => {
  let query = 'SELECT * FROM products';
  if (activeOnly) query += ' WHERE active = 1';
  query += ' ORDER BY name ASC';
  const products = db.prepare(query).all();
  return products.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    videos: JSON.parse(p.videos || '[]')
  }));
};

const deleteProduct = (productId) => db.prepare('DELETE FROM products WHERE id = ?').run(productId);

// ==================== FUNÇÕES DE VENDAS ====================

const createSale = (saleData) => {
  const stmt = db.prepare(`INSERT INTO sales (customer_phone, total, status, payment_method, notes) VALUES (?, ?, ?, ?, ?)`);
  return stmt.run(saleData.customerPhone, saleData.total, saleData.status || 'pending', saleData.paymentMethod || null, saleData.notes || null);
};

const addSaleItem = (saleId, productId, quantity, price) => {
  const stmt = db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`);
  const result = stmt.run(saleId, productId, quantity, price);
  // Atualizar estoque e vendidos
  db.prepare('UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ?').run(quantity, quantity, productId);
  return result;
};

const getSale = (saleId) => {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
  if (!sale) return null;
  const items = db.prepare(`SELECT si.*, p.name as product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`).all(saleId);
  return { ...sale, items };
};

const getAllSales = (status = null) => {
  let query = 'SELECT * FROM sales';
  const params = [];
  if (status) { query += ' WHERE status = ?'; params.push(status); }
  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...params);
};

const updateSaleStatus = (saleId, status) => {
  const updates = { status };
  if (status === 'paid') updates.paid_at = new Date().toISOString();
  if (status === 'delivered') updates.delivered_at = new Date().toISOString();
  const stmt = db.prepare(`UPDATE sales SET status = ?, ${status === 'paid' ? 'paid_at = ?' : status === 'delivered' ? 'delivered_at = ?' : '1=1'} WHERE id = ?`);
  return status === 'paid' || status === 'delivered' ? stmt.run(status, updates[status === 'paid' ? 'paid_at' : 'delivered_at'], saleId) : stmt.run(status, saleId);
};

const getSalesStats = () => {
  const total = db.prepare('SELECT COUNT(*) as count, SUM(total) as revenue FROM sales').get();
  const pending = db.prepare('SELECT COUNT(*) as count FROM sales WHERE status = "pending"').get();
  const paid = db.prepare('SELECT COUNT(*) as count FROM sales WHERE status = "paid"').get();
  const topProducts = db.prepare(`SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.quantity * si.price) as revenue FROM sale_items si JOIN products p ON si.product_id = p.id GROUP BY p.id ORDER BY total_sold DESC LIMIT 5`).all();
  return { totalSales: total.count, totalRevenue: total.revenue || 0, pendingSales: pending.count, paidSales: paid.count, topProducts };
};

// ==================== ESTATÍSTICAS ====================

const getStats = (sessionId) => {
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?').get(sessionId);
    const sentMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND is_from_me = 1').get(sessionId);
    const receivedMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND is_from_me = 0').get(sessionId);
    const totalContacts = db.prepare('SELECT COUNT(DISTINCT from_number) as count FROM messages WHERE session_id = ?').get(sessionId);
    
    return {
        totalMessages: totalMessages.count,
        sentMessages: sentMessages.count,
        receivedMessages: receivedMessages.count,
        totalContacts: totalContacts.count
    };
};

// ==================== FUNÇÕES DE EQUIPE ====================

const saveTeamMember = (memberData) => {
    const stmt = db.prepare(`
        INSERT INTO team_members (
            name, email, phone, role, department, permissions,
            commission_rate, monthly_goal, status, hire_date, avatar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            phone = excluded.phone,
            role = excluded.role,
            department = excluded.department,
            permissions = excluded.permissions,
            commission_rate = excluded.commission_rate,
            monthly_goal = excluded.monthly_goal,
            status = excluded.status,
            hire_date = excluded.hire_date,
            avatar = excluded.avatar,
            updated_at = CURRENT_TIMESTAMP
    `);
    
    return stmt.run(
        memberData.name,
        memberData.email,
        memberData.phone,
        memberData.role,
        memberData.department,
        JSON.stringify(memberData.permissions || []),
        memberData.commission_rate || 0,
        memberData.monthly_goal || 0,
        memberData.status || 'active',
        memberData.hire_date,
        memberData.avatar || null
    );
};

const updateTeamMember = (id, memberData) => {
    const stmt = db.prepare(`
        UPDATE team_members SET
            name = ?,
            phone = ?,
            role = ?,
            department = ?,
            permissions = ?,
            commission_rate = ?,
            monthly_goal = ?,
            status = ?,
            hire_date = ?,
            avatar = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    return stmt.run(
        memberData.name,
        memberData.phone,
        memberData.role,
        memberData.department,
        JSON.stringify(memberData.permissions || []),
        memberData.commission_rate || 0,
        memberData.monthly_goal || 0,
        memberData.status || 'active',
        memberData.hire_date,
        memberData.avatar || null,
        id
    );
};

const getTeamMember = (id) => {
    const stmt = db.prepare('SELECT * FROM team_members WHERE id = ?');
    const member = stmt.get(id);
    if (member && member.permissions) {
        member.permissions = JSON.parse(member.permissions);
    }
    return member;
};

const getTeamMemberByEmail = (email) => {
    const stmt = db.prepare('SELECT * FROM team_members WHERE email = ?');
    const member = stmt.get(email);
    if (member && member.permissions) {
        member.permissions = JSON.parse(member.permissions);
    }
    return member;
};

const getAllTeamMembers = (filters = {}) => {
    let query = 'SELECT * FROM team_members WHERE 1=1';
    const params = [];
    
    if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
    }
    
    if (filters.department) {
        query += ' AND department = ?';
        params.push(filters.department);
    }
    
    if (filters.role) {
        query += ' AND role = ?';
        params.push(filters.role);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const members = stmt.all(...params);
    
    return members.map(member => {
        if (member.permissions) {
            member.permissions = JSON.parse(member.permissions);
        }
        return member;
    });
};

const deleteTeamMember = (id) => {
    const stmt = db.prepare('DELETE FROM team_members WHERE id = ?');
    return stmt.run(id);
};

const saveTeamPerformance = (perfData) => {
    const stmt = db.prepare(`
        INSERT INTO team_performance (
            member_id, month, sales_count, revenue, commission,
            goal_completion, rating, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(member_id, month) DO UPDATE SET
            sales_count = excluded.sales_count,
            revenue = excluded.revenue,
            commission = excluded.commission,
            goal_completion = excluded.goal_completion,
            rating = excluded.rating,
            notes = excluded.notes
    `);
    
    return stmt.run(
        perfData.member_id,
        perfData.month,
        perfData.sales_count || 0,
        perfData.revenue || 0,
        perfData.commission || 0,
        perfData.goal_completion || 0,
        perfData.rating || 0,
        perfData.notes || null
    );
};

const getTeamPerformance = (memberId, month) => {
    const stmt = db.prepare(`
        SELECT * FROM team_performance 
        WHERE member_id = ? AND month = ?
    `);
    return stmt.get(memberId, month);
};

const getAllTeamPerformance = (filters = {}) => {
    let query = 'SELECT * FROM team_performance WHERE 1=1';
    const params = [];
    
    if (filters.member_id) {
        query += ' AND member_id = ?';
        params.push(filters.member_id);
    }
    
    if (filters.month) {
        query += ' AND month = ?';
        params.push(filters.month);
    }
    
    query += ' ORDER BY month DESC, member_id';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
};

const getTeamStats = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const totalMembers = db.prepare('SELECT COUNT(*) as count FROM team_members').get();
    const activeMembers = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE status = ?').get('active');
    
    const monthPerf = db.prepare(`
        SELECT 
            SUM(sales_count) as total_sales,
            SUM(revenue) as total_revenue,
            SUM(commission) as total_commission,
            AVG(goal_completion) as avg_goal_completion
        FROM team_performance
        WHERE month = ?
    `).get(currentMonth);
    
    return {
        total_members: totalMembers.count,
        active_members: activeMembers.count,
        total_sales: monthPerf.total_sales || 0,
        total_revenue: monthPerf.total_revenue || 0,
        total_commission: monthPerf.total_commission || 0,
        avg_goal_completion: monthPerf.avg_goal_completion || 0
    };
};

// Exportar funções
module.exports = {
    db,
    // Sessões
    saveSession,
    updateSessionStatus,
    getSession,
    getAllSessions,
    deleteSession,
    // Mensagens
    saveMessage,
    getMessages,
    getMessagesByContact,
    updateMessageStatus,
    // Contatos
    saveContact,
    getContact,
    getAllContacts,
    // Grupos
    saveGroup,
    addGroupMember,
    getGroupMembers,
    // Logs
    logEvent,
    getEventLogs,
    // Stats
    getStats,
    // CRM - Clientes
    saveCustomer,
    getCustomer,
    getAllCustomers,
    updateCustomerStatus,
    addCustomerTag,
    getCustomerTags,
    removeCustomerTag,
    addCustomerInteraction,
    getCustomerInteractions,
    searchCustomers,
    deleteCustomer,
    // Agentes IA
    saveAgent,
    updateAgent,
    getAgent,
    getAllAgents,
    toggleAgentStatus,
    deleteAgent,
    startAgentConversation,
    endAgentConversation,
    getAgentConversations,
    getAgentStats,
    // Automações
    saveAutomation,
    updateAutomation,
    getAutomation,
    getAllAutomations,
    toggleAutomationStatus,
    deleteAutomation,
    logAutomationExecution,
    getAutomationLogs,
    getAutomationsByTrigger,
    getAutomationStats,
    // Produtos
    saveProduct,
    updateProduct,
    getProduct,
    getAllProducts,
    deleteProduct,
    // Vendas
    createSale,
    addSaleItem,
    getSale,
    getAllSales,
    updateSaleStatus,
    getSalesStats,
    // Equipe
    saveTeamMember,
    updateTeamMember,
    getTeamMember,
    getTeamMemberByEmail,
    getAllTeamMembers,
    deleteTeamMember,
    saveTeamPerformance,
    getTeamPerformance,
    getAllTeamPerformance,
    getTeamStats
};
