// src/pages/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Users, Bell, AlertTriangle } from "lucide-react";
import StatCard from "../../components/StatCard";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClientes: 0,
    lembretesPendentes: 0,
    taxResolvido: "0%",
  });
  const [loading, setLoading] = useState(true);

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    if (!user?.company_id) return;

    setLoading(true);
    try {
      // Buscar total de clientes
      const { count: totalClientes, error: clientesError } = await supabase
        .from("clients")
        .select("*", { count: "exact" })
        .eq("company_id", user.company_id)
        .eq("status", "active");

      if (clientesError) throw clientesError;

      // Buscar lembretes pendentes
      const { count: lembretesPendentes, error: lembretesError } =
        await supabase
          .from("reminders")
          .select("*", { count: "exact" })
          .eq("company_id", user.company_id)
          .eq("status", "pending");

      if (lembretesError) throw lembretesError;

      // Calcular taxa de resolução (mockado para exemplo)
      const taxResolvido = "78%"; // Você pode implementar cálculo real depois

      setStats({
        totalClientes: totalClientes || 0,
        lembretesPendentes: lembretesPendentes || 0,
        taxResolvido,
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.company_id]);

  // Dados recentes mockados
  const recentActivities = [
    {
      id: 1,
      type: "reminder",
      description: "Lembrete criado para Cliente ABC",
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

      {/* Cards Principais Atualizados */}
      <div className="grid-cols-3">
        <StatCard
          title="Total de Clientes"
          value={loading ? "-" : stats.totalClientes}
          icon={<Users size={24} />}
          trend={{ value: "+2 desde ontem", isPositive: true }}
        />

        <StatCard
          title="Lembretes Pendentes"
          value={loading ? "-" : stats.lembretesPendentes}
          icon={<Bell size={24} />}
          trend={{ value: "Precisa de atenção", isPositive: false }}
        />

        <StatCard
          title="Taxa de Resolução"
          value={stats.taxResolvido}
          icon={<CheckCircle size={24} />}
          trend={{ value: "+5% no mês", isPositive: true }}
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

          <Link to="/lembretes" className="action-card">
            <div className="ac-icon">
              <Bell size={20} />
            </div>
            <h3>Ver Lembretes</h3>
            <p>Checklist de lembretes pendentes</p>
          </Link>

          <Link to="/pendencias" className="action-card">
            <div className="ac-icon">
              <AlertTriangle size={20} />
            </div>
            <h3>Ver Obrigações</h3>
            <p>Obrigações fiscais dos clientes</p>
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
                {activity.type === "reminder" ? "Lembrete" : "Cliente"}
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
