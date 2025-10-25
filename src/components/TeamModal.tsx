import React, { useState, useEffect } from 'react';
import { dbService } from '../services/databaseService';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  permissions: string[];
  commission_rate: number;
  monthly_goal: number;
  status: 'active' | 'inactive' | 'vacation';
  hire_date: string;
  avatar?: string;
  createdAt: number;
  updatedAt: number;
}

interface TeamPerformance {
  id: string;
  member_id: string;
  month: string;
  sales_count: number;
  revenue: number;
  commission: number;
  goal_completion: number;
  rating: number;
  notes?: string;
  createdAt: number;
}

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: TeamMember;
  onSave: (memberData: TeamMember) => void;
}

const ROLES = [
  'Vendedor',
  'Gerente de Vendas',
  'Atendente',
  'Supervisor',
  'Coordenador',
  'Diretor Comercial'
];

const DEPARTMENTS = [
  'Vendas',
  'Atendimento',
  'Marketing',
  'Suporte',
  'Administrativo'
];

const PERMISSIONS = [
  'Visualizar CRM',
  'Editar Clientes',
  'Criar Vendas',
  'Aprovar Descontos',
  'Gerenciar Equipe',
  'Relatórios Avançados',
  'Configurações'
];

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, member, onSave }) => {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    phone: '',
    role: 'Vendedor',
    department: 'Vendas',
    permissions: ['Visualizar CRM', 'Criar Vendas'],
    commission_rate: 5,
    monthly_goal: 10000,
    status: 'active',
    hire_date: new Date().toISOString().split('T')[0]
  });

  const [performance, setPerformance] = useState<TeamPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData(member);
      loadPerformance(member.id);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Vendedor',
        department: 'Vendas',
        permissions: ['Visualizar CRM', 'Criar Vendas'],
        commission_rate: 5,
        monthly_goal: 10000,
        status: 'active',
        hire_date: new Date().toISOString().split('T')[0]
      });
      setPerformance([]);
    }
  }, [member]);

  const loadPerformance = async (memberId: string) => {
    try {
      const perf = await dbService.getPerformanceByMember(memberId);
      setPerformance(perf.sort((a, b) => b.month.localeCompare(a.month)));
    } catch (error) {
      console.error('Erro ao carregar desempenho:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const memberData: TeamMember = {
        id: member?.id || `member_${Date.now()}`,
        name: formData.name!,
        email: formData.email!,
        phone: formData.phone!,
        role: formData.role!,
        department: formData.department!,
        permissions: formData.permissions!,
        commission_rate: formData.commission_rate!,
        monthly_goal: formData.monthly_goal!,
        status: formData.status!,
        hire_date: formData.hire_date!,
        avatar: formData.avatar,
        createdAt: member?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await dbService.saveTeamMember(memberData);
      onSave(memberData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
      alert('Erro ao salvar membro da equipe');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    const current = formData.permissions || [];
    if (current.includes(permission)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== permission) });
    } else {
      setFormData({ ...formData, permissions: [...current, permission] });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1e1e1e] border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <i className="fa-solid fa-user w-6 h-6"></i>
            {member ? 'Editar Membro' : 'Novo Membro da Equipe'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="fa-solid fa-times w-6 h-6"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-user w-4 h-4 inline mr-2"></i>
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-envelope w-4 h-4 inline mr-2"></i>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-phone w-4 h-4 inline mr-2"></i>
                Telefone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-calendar w-4 h-4 inline mr-2"></i>
                Data de Contratação *
              </label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>

          {/* Cargo e Departamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-briefcase w-4 h-4 inline mr-2"></i>
                Cargo *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              >
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-building w-4 h-4 inline mr-2"></i>
                Departamento *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-award w-4 h-4 inline mr-2"></i>
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                required
              >
                <option value="active">Ativo</option>
                <option value="vacation">Férias</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          {/* Metas e Comissão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-bullseye w-4 h-4 inline mr-2"></i>
                Meta Mensal (R$) *
              </label>
              <input
                type="number"
                value={formData.monthly_goal}
                onChange={(e) => setFormData({ ...formData, monthly_goal: parseFloat(e.target.value) })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                min="0"
                step="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <i className="fa-solid fa-dollar-sign w-4 h-4 inline mr-2"></i>
                Taxa de Comissão (%) *
              </label>
              <input
                type="number"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg px-4 py-2 text-white"
                min="0"
                max="100"
                step="0.5"
                required
              />
            </div>
          </div>

          {/* Permissões */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <i className="fa-solid fa-shield w-4 h-4 inline mr-2"></i>
              Permissões
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PERMISSIONS.map(permission => (
                <label key={permission} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions?.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="rounded border-gray-600 bg-[#2a2a2a]"
                  />
                  {permission}
                </label>
              ))}
            </div>
          </div>

          {/* Desempenho (apenas para edição) */}
          {member && performance.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i className="fa-solid fa-chart-line w-5 h-5"></i>
                Histórico de Desempenho
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {performance.map(perf => (
                  <div key={perf.id} className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{perf.month}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        perf.goal_completion >= 100 ? 'bg-green-500/20 text-green-400' :
                        perf.goal_completion >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {perf.goal_completion.toFixed(0)}% da meta
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Vendas:</span>
                        <span className="text-white ml-2">{perf.sales_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Receita:</span>
                        <span className="text-white ml-2">R$ {perf.revenue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Comissão:</span>
                        <span className="text-green-400 ml-2">R$ {perf.commission.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : member ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
