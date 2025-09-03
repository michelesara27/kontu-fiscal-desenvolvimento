// src/pages/Pendencies/Pendencies.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import StatCard from "../../components/StatCard";
import { supabase } from "../../lib/supabase";

interface Pendency {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed" | "overdue";
  due_date: string;
  client_id: string;
  clients: {
    name: string;
  };
}

const Pendencies: React.FC = () => {
  const [pendencies, setPendencies] = useState<Pendency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendencies();
  }, []);

  const fetchPendencies = async () => {
    try {
      const { data, error } = await supabase
        .from("pendencies")
        .select(
          `
          *,
          clients (name)
        `
        )
        .order("due_date", { ascending: true });

      if (error) throw error;
      setPendencies(data || []);
    } catch (error) {
      console.error("Error fetching pendencies:", error);
    } finally {
      setLoading(false);
    }
  };

  const overduePendencies = pendencies.filter(
    (p) => p.status === "overdue"
  ).length;
  const pendingPendencies = pendencies.filter(
    (p) => p.status === "pending"
  ).length;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Pendências</h1>
        <p>Acompanhe as obrigações pendentes</p>
      </header>

      <div className="grid-cols-3">
        <StatCard
          title="Total de Pendências"
          value={pendencies.length}
          icon={<AlertTriangle size={24} />}
        />
        <StatCard
          title="Pendências Atrasadas"
          value={overduePendencies}
          icon={<Clock size={24} />}
        />
        <StatCard
          title="Pendências em Aberto"
          value={pendingPendencies}
          icon={<CheckCircle size={24} />}
        />
      </div>

      <section className="page-section">
        <div className="section-header">
          <h2>Pendências por Cliente</h2>
          <Link to="/nova-pendencia" className="btn-primary">
            <Plus size={18} />
            Nova Obrigação
          </Link>
        </div>

        <div className="data-table">
          <div className="table-header">
            <span>Cliente</span>
            <span>Título</span>
            <span>Vencimento</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            pendencies.map((pendency) => (
              <div key={pendency.id} className="table-row">
                <span>{pendency.clients?.name}</span>
                <span>{pendency.title}</span>
                <span>{new Date(pendency.due_date).toLocaleDateString()}</span>
                <span className={`status-badge ${pendency.status}`}>
                  {pendency.status === "overdue"
                    ? "Atrasado"
                    : pendency.status === "pending"
                    ? "Pendente"
                    : "Concluído"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Pendencies;
