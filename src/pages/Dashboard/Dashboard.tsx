// src/pages/Dashboard/Dashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Users,
  AlertTriangle,
  Bell,
} from "lucide-react";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Dados mockados - você vai substituir por dados reais do seu banco
  const stats = {
    totalPendencias: 24,
    totalAtrasadas: 7,
    taxResolvido: "78%",
    totalClientes: 42,
    clientesAtivos: 38,
    lembretesPendentes: 12,
  };

  // Dados recentes mockados
  const recentActivities = [
    {
      id: 1,
      type: "pendency",
      description: "Pendência criada para Cliente ABC",
      time: "2 min ago",
    },
    {
      id: 2,
      type: "client",
      description: "Novo cliente cadastrado",
      time: "5 min ago",
    },
    {
      id: 3,
      type: "reminder",
      description: "Lembrete concluído",
      time: "10 min ago",
    },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Bem-vindo, {user?.name}!</h1>
        <p>Resumo do seu negócio hoje</p>
      </header>

      {/* Cards Principais */}
      <div className="grid-cols-3">
        <StatCard
          title="Total de Pendências"
          value={stats.totalPendencias}
          icon={<AlertCircle size={24} />}
          trend={{ value: "+2 desde ontem", isPositive: false }}
        />
        <StatCard
          title="Pendências Atrasadas"
          value={stats.totalAtrasadas}
          icon={<Clock size={24} />}
          trend={{ value: "Precisa de atenção", isPositive: false }}
        />
        <StatCard
          title="Taxa de Resolução"
          value={stats.taxResolvido}
          icon={<CheckCircle size={24} />}
          trend={{ value: "+5% no mês", isPositive: true }}
        />
      </div>

      {/* Estatísticas Adicionais */}
      <div className="grid-cols-3">
        <StatCard
          title="Total de Clientes"
          value={stats.totalClientes}
          icon={<Users size={24} />}
        />
        <StatCard
          title="Clientes Ativos"
          value={stats.clientesAtivos}
          icon={<Users size={24} />}
        />
        <StatCard
          title="Lembretes Pendentes"
          value={stats.lembretesPendentes}
          icon={<Bell size={24} />}
        />
      </div>

      {/* Ações Rápidas */}
      <section className="page-section">
        <h2>
          <Bell size={20} />
          Ações Rápidas
        </h2>
        <div className="action-grid">
          <Link to="/clientes" className="action-card">
            <div className="ac-icon">
              <Users size={20} />
            </div>
            <h3>Gerenciar Clientes</h3>
            <p>Visualize e edite sua base de clientes</p>
          </Link>
          <Link to="/pendencias" className="action-card">
            <div className="ac-icon">
              <AlertTriangle size={20} />
            </div>
            <h3>Ver Pendências</h3>
            <p>Checklist de tarefas pendentes</p>
          </Link>
          <Link to="/lembretes" className="action-card">
            <div className="ac-icon">
              <Bell size={20} />
            </div>
            <h3>Definir Lembretes</h3>
            <p>Programe notificações importantes</p>
          </Link>
        </div>
      </section>

      {/* Atividades Recentes */}
      <section className="page-section">
        <h2>Atividades Recentes</h2>
        <div className="data-table">
          <div className="table-header">
            <span>Descrição</span>
            <span>Tipo</span>
            <span>Status</span>
            <span>Horário</span>
          </div>
          {recentActivities.map((activity) => (
            <div key={activity.id} className="table-row">
              <span>{activity.description}</span>
              <span className="status-badge pending">
                {activity.type === "pendency"
                  ? "Pendência"
                  : activity.type === "client"
                  ? "Cliente"
                  : "Lembrete"}
              </span>
              <span className="status-badge active">Ativo</span>
              <span>{activity.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
