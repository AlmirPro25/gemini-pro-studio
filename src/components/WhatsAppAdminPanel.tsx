/**
 * 📊 WHATSAPP ADMIN PANEL - PAINEL EMPRESARIAL
 * 
 * Sistema completo de gestão empresarial via WhatsApp
 * - Dashboard com métricas
 * - CRM integrado
 * - Sistema de vendas
 * - Gerenciador de agentes
 * - Automações
 * - Multi-atendente
 */

import React, { useState, useEffect } from 'react';
import { CustomerModal } from './CustomerModal';
import { AgentModal } from './AgentModal';
import { AutomationModal } from './AutomationModal';
import { TeamModal } from './TeamModal';
import { ProductCatalog } from './ProductCatalog';
import { dbService } from '../services/databaseService';

const BRIDGE_URL = (import.meta as any).env?.VITE_WHATSAPP_BRIDGE_URL || 'http://localhost:3001';

interface Metric {
  label: string;
  value: number;
  change: number;
  icon: string;
  color: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  status: 'lead' | 'customer' | 'vip';
  totalSpent: number;
  lastContact: number;
  tags: string[];
}

interface Agent {
  id: string;
  name: string;
  type: string;
  prompt: string;
  active: boolean;
  conversations: number;
  satisfaction: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  stock: number;
  sold: number;
}

interface Sale {
  id: string;
  customer: string;
  products: string[];
  total: number;
  status: 'pending' | 'paid' | 'delivered';
  date: number;
}

type AdminView = 'dashboard' | 'crm' | 'agents' | 'sales' | 'automations' | 'team';

export const WhatsAppAdminPanel: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  
  const [automations, setAutomations] = useState<any[]>([]);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<any>(null);
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamFilterDepartment, setTeamFilterDepartment] = useState<string | null>(null);
  const [teamFilterStatus, setTeamFilterStatus] = useState<string | null>(null);

  // Carregar dados reais do banco
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Carregar clientes quando mudar filtro
  useEffect(() => {
    if (activeView === 'crm') {
      loadCustomers();
    }
  }, [activeView, filterStatus]);

  const handleSaveCustomer = async (customerData: any) => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/crm/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        // Adicionar tags
        if (customerData.tags && customerData.tags.length > 0) {
          for (const tag of customerData.tags) {
            await fetch(`${BRIDGE_URL}/api/crm/customers/${customerData.phoneNumber}/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag })
            });
          }
        }

        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
        loadCustomers();
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente');
    }
  };

  const handleDeleteCustomer = async (phone: string) => {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/crm/customers/${phone}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadCustomers();
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      alert('Erro ao deletar cliente');
    }
  };

  const handleChangeStatus = async (phone: string, newStatus: string) => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/crm/customers/${phone}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadCustomers();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Funções dos Agentes
  const loadAgents = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents.map((a: any) => ({
          id: a.id.toString(),
          name: a.name,
          type: a.type,
          prompt: a.prompt,
          active: a.active === 1,
          conversations: a.totalConversations || 0,
          satisfaction: Math.round(a.avgSatisfaction || 0)
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    }
  };

  const handleSaveAgent = async (agentData: any) => {
    try {
      const url = editingAgent 
        ? `${BRIDGE_URL}/api/agents/${editingAgent.id}`
        : `${BRIDGE_URL}/api/agents`;
      
      const method = editingAgent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      if (response.ok) {
        setIsAgentModalOpen(false);
        setEditingAgent(null);
        loadAgents();
      }
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      alert('Erro ao salvar agente');
    }
  };

  const handleToggleAgent = async (agentId: string) => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/agents/${agentId}/toggle`, {
        method: 'PATCH'
      });

      if (response.ok) {
        loadAgents();
      }
    } catch (error) {
      console.error('Erro ao alternar status:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este agente?')) return;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/agents/${agentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadAgents();
      }
    } catch (error) {
      console.error('Erro ao deletar agente:', error);
      alert('Erro ao deletar agente');
    }
  };

  // Carregar agentes quando mudar de view
  useEffect(() => {
    if (activeView === 'agents') {
      loadAgents();
    }
  }, [activeView]);

  // Funções das Automações
  const loadAutomations = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/automations`);
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations);
      }
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
    }
  };

  const handleSaveAutomation = async (automationData: any) => {
    try {
      const url = editingAutomation 
        ? `${BRIDGE_URL}/api/automations/${editingAutomation.id}`
        : `${BRIDGE_URL}/api/automations`;
      
      const method = editingAutomation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationData)
      });

      if (response.ok) {
        setIsAutomationModalOpen(false);
        setEditingAutomation(null);
        loadAutomations();
      }
    } catch (error) {
      console.error('Erro ao salvar automação:', error);
      alert('Erro ao salvar automação');
    }
  };

  const handleToggleAutomation = async (automationId: string) => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/automations/${automationId}/toggle`, {
        method: 'PATCH'
      });

      if (response.ok) {
        loadAutomations();
      }
    } catch (error) {
      console.error('Erro ao alternar status:', error);
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta automação?')) return;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/automations/${automationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadAutomations();
      }
    } catch (error) {
      console.error('Erro ao deletar automação:', error);
      alert('Erro ao deletar automação');
    }
  };

  // Carregar automações quando mudar de view
  useEffect(() => {
    if (activeView === 'automations') {
      loadAutomations();
    }
  }, [activeView]);

  // Funções de Vendas
  const loadSalesData = async () => {
    try {
      const [productsRes, salesRes, statsRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/products`),
        fetch(`${BRIDGE_URL}/api/sales`),
        fetch(`${BRIDGE_URL}/api/sales/stats`)
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products);
      }
      
      if (salesRes.ok) {
        const data = await salesRes.json();
        setSales(data.sales);
      }
      
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setSalesStats(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de vendas:', error);
    }
  };

  useEffect(() => {
    if (activeView === 'sales') {
      loadSalesData();
    }
  }, [activeView]);

  const loadCustomers = async () => {
    try {
      const url = filterStatus 
        ? `${BRIDGE_URL}/api/crm/customers?status=${filterStatus}`
        : `${BRIDGE_URL}/api/crm/customers`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers.map((c: any) => ({
          id: c.id.toString(),
          name: c.name || c.phone_number,
          phone: c.phone_number,
          lastMessage: 'Última interação...',
          status: c.status,
          totalSpent: c.total_spent || 0,
          lastContact: new Date(c.updated_at).getTime(),
          tags: c.tags || []
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Buscar estatísticas
      const statsRes = await fetch(`${BRIDGE_URL}/api/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);

        // Atualizar métricas com dados reais
        setMetrics([
          { 
            label: 'Total Mensagens', 
            value: statsData.stats.totalMessages || 0, 
            change: 12, 
            icon: 'fa-comments', 
            color: 'blue' 
          },
          { 
            label: 'Mensagens Enviadas', 
            value: statsData.stats.sentMessages || 0, 
            change: 8, 
            icon: 'fa-paper-plane', 
            color: 'green' 
          },
          { 
            label: 'Mensagens Recebidas', 
            value: statsData.stats.receivedMessages || 0, 
            change: 15, 
            icon: 'fa-inbox', 
            color: 'purple' 
          },
          { 
            label: 'Contatos Ativos', 
            value: statsData.stats.totalContacts || 0, 
            change: 3, 
            icon: 'fa-users', 
            color: 'yellow' 
          }
        ]);
      }

      // Buscar mensagens recentes
      const messagesRes = await fetch(`${BRIDGE_URL}/api/db/messages?limit=10`);
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setRecentMessages(messagesData.messages || []);
      }

      // Buscar contatos
      const contactsRes = await fetch(`${BRIDGE_URL}/api/db/contacts`);
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.contacts || []);

        // Converter contatos para formato de customers
        const customersData = contactsData.contacts.slice(0, 10).map((contact: any) => ({
          id: contact.id.toString(),
          name: contact.name || contact.phone_number,
          phone: contact.phone_number,
          lastMessage: 'Última mensagem...',
          status: 'customer' as const,
          totalSpent: 0,
          lastContact: new Date(contact.updated_at).getTime(),
          tags: []
        }));
        setCustomers(customersData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      {/* Header com botão de atualizar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
        <button 
          onClick={loadDashboardData}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
          Atualizar
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.length === 0 ? (
          <div className="col-span-4 text-center py-12 text-text-tertiary">
            <i className="fas fa-spinner fa-spin text-3xl mb-2"></i>
            <p>Carregando métricas...</p>
          </div>
        ) : (
          metrics.map((metric, idx) => (
          <div key={idx} className={`bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600 rounded-xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <i className={`fas ${metric.icon} text-3xl opacity-80`}></i>
              <span className={`text-sm px-2 py-1 rounded-full ${metric.change > 0 ? 'bg-green-400' : 'bg-red-400'}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {metric.label === 'Receita' ? `R$ ${metric.value.toLocaleString()}` : metric.value}
              {metric.label === 'Satisfação' && '%'}
            </h3>
            <p className="text-sm opacity-80">{metric.label}</p>
          </div>
          ))
        )}
      </div>

      {/* Gráficos e Atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mensagens Recentes */}
        <div className="bg-bg-secondary rounded-xl p-6 border border-border-color">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-chart-line text-blue-500"></i>
            Mensagens Recentes
          </h3>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-text-tertiary">
                <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Carregando...</p>
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <i className="fas fa-inbox text-3xl mb-2"></i>
                <p>Nenhuma mensagem ainda</p>
              </div>
            ) : (
              recentMessages.slice(0, 5).map((msg, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-primary transition-colors cursor-pointer">
                  <div className={`w-3 h-3 rounded-full ${
                    msg.is_from_me ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-text-primary text-sm">
                        {msg.is_from_me ? 'Você' : msg.from_number}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary truncate">{msg.content || '[Mídia]'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contatos Mais Ativos */}
        <div className="bg-bg-secondary rounded-xl p-6 border border-border-color">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-users text-green-500"></i>
            Contatos Mais Ativos
          </h3>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-text-tertiary">
                <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Carregando...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <i className="fas fa-user-friends text-3xl mb-2"></i>
                <p>Nenhum contato ainda</p>
                <p className="text-xs mt-2">Comece a conversar pelo WhatsApp</p>
              </div>
            ) : (
              contacts.slice(0, 5).map((contact, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {(contact.name || contact.phone_number).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm truncate">
                        {contact.name || contact.phone_number}
                      </p>
                      <p className="text-xs text-text-tertiary">{contact.phone_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">
                      {new Date(contact.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-bg-secondary rounded-xl p-6 border border-border-color">
        <h3 className="text-lg font-bold text-text-primary mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={loadDashboardData}
            className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all flex flex-col items-center gap-2 shadow-md hover:shadow-lg"
          >
            <i className={`fas fa-sync-alt text-2xl ${isLoading ? 'fa-spin' : ''}`}></i>
            <span className="text-sm font-medium">Atualizar Dados</span>
          </button>
          <button 
            onClick={() => window.open('http://localhost:3001/api/db/export', '_blank')}
            className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all flex flex-col items-center gap-2 shadow-md hover:shadow-lg"
          >
            <i className="fas fa-download text-2xl"></i>
            <span className="text-sm font-medium">Exportar Dados</span>
          </button>
          <button 
            onClick={() => window.open('http://localhost:3001/api/stats', '_blank')}
            className="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all flex flex-col items-center gap-2 shadow-md hover:shadow-lg"
          >
            <i className="fas fa-chart-bar text-2xl"></i>
            <span className="text-sm font-medium">Ver Estatísticas</span>
          </button>
          <button 
            onClick={() => window.open('http://localhost:3001/api/db/logs', '_blank')}
            className="p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all flex flex-col items-center gap-2 shadow-md hover:shadow-lg"
          >
            <i className="fas fa-list text-2xl"></i>
            <span className="text-sm font-medium">Ver Logs</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderCRM = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">CRM - Clientes</h2>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setIsCustomerModalOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <i className="fas fa-user-plus"></i>
          Novo Cliente
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar clientes..."
            className="w-full bg-bg-tertiary border border-border-color rounded-lg pl-11 pr-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button 
          onClick={() => setFilterStatus(null)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === null ? 'bg-blue-500 text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
          }`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilterStatus('lead')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'lead' ? 'bg-blue-500 text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
          }`}
        >
          Leads
        </button>
        <button 
          onClick={() => setFilterStatus('customer')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'customer' ? 'bg-green-500 text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
          }`}
        >
          Clientes
        </button>
        <button 
          onClick={() => setFilterStatus('vip')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'vip' ? 'bg-yellow-500 text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
          }`}
        >
          VIP
        </button>
      </div>

      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {customers.length === 0 ? (
          <div className="text-center py-12 bg-bg-secondary rounded-xl border border-border-color">
            <i className="fas fa-users text-4xl text-text-tertiary mb-4"></i>
            <p className="text-text-secondary mb-2">Nenhum cliente encontrado</p>
            <button
              onClick={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Criar primeiro cliente
            </button>
          </div>
        ) : (
          customers
            .filter(c => 
              !searchTerm || 
              c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.phone.includes(searchTerm)
            )
            .map(customer => (
          <div key={customer.id} className="bg-bg-secondary rounded-xl p-6 border border-border-color hover:border-blue-500 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-text-primary">{customer.name}</h3>
                    <select
                      value={customer.status}
                      onChange={(e) => handleChangeStatus(customer.phone, e.target.value)}
                      className={`text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer ${
                        customer.status === 'vip' ? 'bg-yellow-500/20 text-yellow-500' :
                        customer.status === 'customer' ? 'bg-green-500/20 text-green-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}
                    >
                      <option value="lead">LEAD</option>
                      <option value="customer">CLIENTE</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                  <p className="text-sm text-text-tertiary mb-2">{customer.phone}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {customer.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-bg-tertiary text-text-tertiary rounded">
                        {tag}
                      </span>
                    ))}
                    {customer.tags.length === 0 && (
                      <span className="text-xs text-text-tertiary italic">Sem tags</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-500">R$ {customer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-text-tertiary">Total gasto</p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingCustomer(customer);
                  setIsCustomerModalOpen(true);
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition-colors"
              >
                <i className="fas fa-edit mr-2"></i>
                Editar
              </button>
              <button
                onClick={() => window.open(`https://wa.me/${customer.phone}`, '_blank')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm transition-colors"
              >
                <i className="fab fa-whatsapp mr-2"></i>
                WhatsApp
              </button>
              <button
                onClick={() => handleDeleteCustomer(customer.phone)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Modal */}
      {isCustomerModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
          }}
          onSave={handleSaveCustomer}
        />
      )}
    </div>
  );

  const renderAgents = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Agentes IA</h2>
        <button 
          onClick={() => {
            setEditingAgent(null);
            setIsAgentModalOpen(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <i className="fas fa-robot"></i>
          Criar Agente
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-xl border border-border-color">
          <i className="fas fa-robot text-4xl text-text-tertiary mb-4"></i>
          <p className="text-text-secondary mb-2">Nenhum agente criado ainda</p>
          <button
            onClick={() => {
              setEditingAgent(null);
              setIsAgentModalOpen(true);
            }}
            className="text-purple-500 hover:text-purple-600 text-sm"
          >
            Criar primeiro agente
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {agents.map(agent => (
          <div key={agent.id} className="bg-bg-secondary rounded-xl p-6 border border-border-color hover:border-purple-500 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-robot text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">{agent.name}</h3>
                  <p className="text-sm text-text-tertiary capitalize">{agent.type}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={agent.active} 
                  onChange={() => handleToggleAgent(agent.id)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            <p className="text-sm text-text-secondary mb-4 line-clamp-3">{agent.prompt}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                <p className="text-2xl font-bold text-text-primary">{agent.conversations}</p>
                <p className="text-xs text-text-tertiary">Conversas</p>
              </div>
              <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                <p className="text-2xl font-bold text-green-500">{agent.satisfaction}%</p>
                <p className="text-xs text-text-tertiary">Satisfação</p>
              </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setEditingAgent(agent);
                  setIsAgentModalOpen(true);
                }}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm transition-colors"
              >
                <i className="fas fa-edit mr-2"></i>
                Editar
              </button>
              <button 
                onClick={() => handleDeleteAgent(agent.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isAgentModalOpen && (
        <AgentModal
          agent={editingAgent}
          onClose={() => {
            setIsAgentModalOpen(false);
            setEditingAgent(null);
          }}
          onSave={handleSaveAgent}
        />
      )}
    </div>
  );

  const renderSales = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Vendas</h2>

      {/* Estatísticas */}
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <i className="fas fa-dollar-sign text-3xl opacity-80 mb-4"></i>
            <h3 className="text-2xl font-bold mb-1">R$ {(salesStats.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p className="text-sm opacity-80">Receita Total</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <i className="fas fa-shopping-cart text-3xl opacity-80 mb-4"></i>
            <h3 className="text-2xl font-bold mb-1">{salesStats.totalSales || 0}</h3>
            <p className="text-sm opacity-80">Total de Vendas</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <i className="fas fa-clock text-3xl opacity-80 mb-4"></i>
            <h3 className="text-2xl font-bold mb-1">{salesStats.pendingSales || 0}</h3>
            <p className="text-sm opacity-80">Pendentes</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <i className="fas fa-check text-3xl opacity-80 mb-4"></i>
            <h3 className="text-2xl font-bold mb-1">{salesStats.paidSales || 0}</h3>
            <p className="text-sm opacity-80">Pagas</p>
          </div>
        </div>
      )}

      {/* Produtos e Vendas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Produtos */}
        <div className="bg-bg-secondary rounded-xl p-6 border border-border-color">
          <h3 className="text-lg font-bold text-text-primary mb-4">Produtos</h3>
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="text-text-tertiary text-center py-4">Nenhum produto cadastrado</p>
            ) : (
              products.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">{product.name}</p>
                    <p className="text-xs text-text-tertiary">Estoque: {product.stock} | Vendidos: {product.sold}</p>
                  </div>
                  <p className="font-bold text-green-500">R$ {product.price.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vendas Recentes */}
        <div className="bg-bg-secondary rounded-xl p-6 border border-border-color">
          <h3 className="text-lg font-bold text-text-primary mb-4">Vendas Recentes</h3>
          <div className="space-y-3">
            {sales.length === 0 ? (
              <p className="text-text-tertiary text-center py-4">Nenhuma venda registrada</p>
            ) : (
              sales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary text-sm">{sale.customer_phone}</p>
                    <p className="text-xs text-text-tertiary">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-500">R$ {sale.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sale.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                      sale.status === 'delivered' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Produtos */}
      {salesStats?.topProducts && salesStats.topProducts.length > 0 && (
        <div className="bg-bg-secondary rounded-xl p-6 border border-border-color">
          <h3 className="text-lg font-bold text-text-primary mb-4">🏆 Produtos Mais Vendidos</h3>
          <div className="space-y-3">
            {salesStats.topProducts.map((product: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-bg-tertiary rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text-primary">{product.name}</p>
                  <p className="text-xs text-text-tertiary">{product.total_sold} unidades vendidas</p>
                </div>
                <p className="font-bold text-green-500">R$ {product.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAutomations = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Automações</h2>
        <button 
          onClick={() => {
            setEditingAutomation(null);
            setIsAutomationModalOpen(true);
          }}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <i className="fas fa-bolt"></i>
          Criar Automação
        </button>
      </div>

      {automations.length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-xl border border-border-color">
          <i className="fas fa-bolt text-4xl text-text-tertiary mb-4"></i>
          <p className="text-text-secondary mb-2">Nenhuma automação criada ainda</p>
          <button
            onClick={() => {
              setEditingAutomation(null);
              setIsAutomationModalOpen(true);
            }}
            className="text-orange-500 hover:text-orange-600 text-sm"
          >
            Criar primeira automação
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {automations.map(automation => (
            <div key={automation.id} className="bg-bg-secondary rounded-xl p-6 border border-border-color hover:border-orange-500 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary mb-1">{automation.name}</h3>
                  {automation.description && (
                    <p className="text-sm text-text-tertiary mb-3">{automation.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded">
                      <i className="fas fa-bolt mr-1"></i>
                      {automation.trigger_type}
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded">
                      <i className="fas fa-play mr-1"></i>
                      {automation.action_type}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={automation.active === 1} 
                    onChange={() => handleToggleAutomation(automation.id)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-xl font-bold text-text-primary">{automation.executions || 0}</p>
                  <p className="text-xs text-text-tertiary">Execuções</p>
                </div>
                <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-xl font-bold text-green-500">{automation.successRate || 0}%</p>
                  <p className="text-xs text-text-tertiary">Sucesso</p>
                </div>
                <div className="text-center p-3 bg-bg-tertiary rounded-lg">
                  <p className="text-xl font-bold text-red-500">{automation.failureCount || 0}</p>
                  <p className="text-xs text-text-tertiary">Falhas</p>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingAutomation(automation);
                    setIsAutomationModalOpen(true);
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteAutomation(automation.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isAutomationModalOpen && (
        <AutomationModal
          automation={editingAutomation}
          onClose={() => {
            setIsAutomationModalOpen(false);
            setEditingAutomation(null);
          }}
          onSave={handleSaveAutomation}
        />
      )}
    </div>
  );

  // Funções da Equipe
  const loadTeamData = async () => {
    try {
      // Buscar membros da API
      const membersRes = await fetch(`${BRIDGE_URL}/api/team/members`);
      if (membersRes.ok) {
        const data = await membersRes.json();
        setTeamMembers(data.members);
      }

      // Buscar estatísticas da API
      const statsRes = await fetch(`${BRIDGE_URL}/api/team/stats`);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setTeamStats(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
    }
  };

  useEffect(() => {
    if (activeView === 'team') {
      loadTeamData();
    }
  }, [activeView]);

  const handleSaveTeamMember = async (memberData: any) => {
    try {
      const url = editingTeamMember 
        ? `${BRIDGE_URL}/api/team/members/${editingTeamMember.id}`
        : `${BRIDGE_URL}/api/team/members`;
      
      const method = editingTeamMember ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      });

      if (response.ok) {
        setIsTeamModalOpen(false);
        setEditingTeamMember(null);
        loadTeamData();
      }
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
      alert('Erro ao salvar membro da equipe');
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este membro da equipe?')) return;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/team/members/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadTeamData();
      }
    } catch (error) {
      console.error('Erro ao deletar membro:', error);
      alert('Erro ao remover membro');
    }
  };

  const renderTeam = () => {
    const filteredMembers = teamMembers.filter(member => {
      const matchesSearch = !teamSearchTerm || 
        member.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(teamSearchTerm.toLowerCase());
      const matchesDepartment = !teamFilterDepartment || member.department === teamFilterDepartment;
      const matchesStatus = !teamFilterStatus || member.status === teamFilterStatus;
      return matchesSearch && matchesDepartment && matchesStatus;
    });

    const departments = Array.from(new Set(teamMembers.map(m => m.department)));

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <i className="fas fa-users"></i>
              Gestão de Equipe
            </h2>
            <p className="text-text-tertiary mt-1">Gerencie sua equipe e acompanhe o desempenho</p>
          </div>
          <div className="flex gap-3">
            {teamMembers.length === 0 && (
              <button
                onClick={async () => {
                  if (confirm('Deseja gerar dados de exemplo? Isso criará 3 membros com histórico de performance.')) {
                    try {
                      const response = await fetch(`${BRIDGE_URL}/api/team/generate-sample-data`, {
                        method: 'POST'
                      });
                      
                      if (response.ok) {
                        loadTeamData();
                        alert('✅ Dados de exemplo gerados com sucesso!');
                      } else {
                        throw new Error('Erro ao gerar dados');
                      }
                    } catch (error) {
                      console.error('Erro ao gerar dados:', error);
                      alert('❌ Erro ao gerar dados de exemplo');
                    }
                  }
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
              >
                <i className="fas fa-magic"></i>
                Gerar Dados de Exemplo
              </button>
            )}
            <button
              onClick={() => {
                setEditingTeamMember(null);
                setIsTeamModalOpen(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
            >
              <i className="fas fa-user-plus"></i>
              Adicionar Membro
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {teamStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <i className="fas fa-users text-2xl opacity-80 mb-2"></i>
              <div className="text-2xl font-bold">{teamStats.total_members}</div>
              <div className="text-sm opacity-80">Total</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <i className="fas fa-check-circle text-2xl opacity-80 mb-2"></i>
              <div className="text-2xl font-bold">{teamStats.active_members}</div>
              <div className="text-sm opacity-80">Ativos</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <i className="fas fa-shopping-cart text-2xl opacity-80 mb-2"></i>
              <div className="text-2xl font-bold">{teamStats.total_sales}</div>
              <div className="text-sm opacity-80">Vendas (mês)</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
              <i className="fas fa-dollar-sign text-2xl opacity-80 mb-2"></i>
              <div className="text-2xl font-bold">R$ {teamStats.total_revenue.toFixed(0)}</div>
              <div className="text-sm opacity-80">Receita</div>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white">
              <i className="fas fa-money-bill text-2xl opacity-80 mb-2"></i>
              <div className="text-2xl font-bold">R$ {teamStats.total_commission.toFixed(0)}</div>
              <div className="text-sm opacity-80">Comissões</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <i className="fas fa-bullseye text-2xl opacity-80 mb-2"></i>
              <div className="text-2xl font-bold">{teamStats.avg_goal_completion.toFixed(0)}%</div>
              <div className="text-sm opacity-80">Meta Média</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"></i>
            <input
              type="text"
              placeholder="Buscar por nome, email ou cargo..."
              value={teamSearchTerm}
              onChange={(e) => setTeamSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={teamFilterDepartment || ''}
            onChange={(e) => setTeamFilterDepartment(e.target.value || null)}
            className="px-4 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos Departamentos</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={teamFilterStatus || ''}
            onChange={(e) => setTeamFilterStatus(e.target.value || null)}
            className="px-4 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos Status</option>
            <option value="active">Ativo</option>
            <option value="vacation">Férias</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        {/* Lista de Membros */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 bg-bg-secondary rounded-xl border border-border-color">
            <i className="fas fa-users text-4xl text-text-tertiary mb-4"></i>
            <p className="text-text-secondary mb-2">
              {teamSearchTerm || teamFilterDepartment || teamFilterStatus
                ? 'Nenhum membro encontrado com os filtros aplicados'
                : 'Nenhum membro cadastrado ainda'}
            </p>
            <button
              onClick={() => {
                setEditingTeamMember(null);
                setIsTeamModalOpen(true);
              }}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Adicionar primeiro membro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMembers.map(member => (
              <div key={member.id} className="bg-bg-secondary rounded-xl p-5 border border-border-color hover:border-blue-500 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-text-primary font-semibold">{member.name}</h3>
                      <p className="text-text-tertiary text-sm">{member.role}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member.status === 'active' ? 'bg-green-500/20 text-green-500' :
                    member.status === 'vacation' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {member.status === 'active' ? 'Ativo' : member.status === 'vacation' ? 'Férias' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <i className="fas fa-envelope w-4 text-text-tertiary"></i>
                    {member.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <i className="fas fa-phone w-4 text-text-tertiary"></i>
                    {member.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <i className="fas fa-calendar w-4 text-text-tertiary"></i>
                    Desde {new Date(member.hire_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-border-color">
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Meta Mensal</div>
                    <div className="text-text-primary font-semibold">R$ {member.monthly_goal.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Comissão</div>
                    <div className="text-green-500 font-semibold">{member.commission_rate}%</div>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingTeamMember(member);
                      setIsTeamModalOpen(true);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition-colors"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTeamMember(member.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isTeamModalOpen && (
          <TeamModal
            isOpen={isTeamModalOpen}
            onClose={() => {
              setIsTeamModalOpen(false);
              setEditingTeamMember(null);
            }}
            member={editingTeamMember}
            onSave={handleSaveTeamMember}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-bg-primary">
      {/* Sidebar */}
      <div className="w-64 bg-bg-secondary border-r border-border-color flex flex-col">
        <div className="p-6 border-b border-border-color">
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <i className="fas fa-crown text-yellow-500"></i>
            Admin Panel
          </h1>
          <p className="text-sm text-text-tertiary mt-1">Gestão Empresarial</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
            { id: 'crm', icon: 'fa-users', label: 'CRM' },
            { id: 'agents', icon: 'fa-robot', label: 'Agentes IA' },
            { id: 'sales', icon: 'fa-shopping-cart', label: 'Vendas' },
            { id: 'automations', icon: 'fa-bolt', label: 'Automações' },
            { id: 'team', icon: 'fa-user-friends', label: 'Equipe' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AdminView)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === item.id
                  ? 'bg-blue-500 text-white'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border-color">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
            <p className="text-sm font-bold mb-1">🚀 Upgrade Pro</p>
            <p className="text-xs opacity-90 mb-3">Recursos ilimitados</p>
            <button className="w-full bg-white text-purple-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-100">
              Assinar Agora
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'crm' && renderCRM()}
        {activeView === 'agents' && renderAgents()}
        {activeView === 'sales' && <ProductCatalog />}
        {activeView === 'automations' && renderAutomations()}
        {activeView === 'team' && renderTeam()}
      </div>
    </div>
  );
};
