// src/pages/Pendencies/Obligations.tsx
import React, { useEffect, useState } from "react";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import StatCard from "../../components/StatCard";
import ObligationForm from "../../components/ObligationForm";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import type { Pendency } from "../../lib/supabase";

const Obligations: React.FC = () => {
  const { user } = useAuth();
  const [obligations, setObligations] = useState<Pendency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar obrigações
  const fetchObligations = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pendencies")
        .select(`*, clients(name)`) // <-- Esta query pode ser o problema
        .eq("company_id", user.company_id)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setObligations(data || []);
    } catch (error) {
      console.error("Erro ao buscar obrigações:", error);
      alert("Erro ao carregar obrigações fiscais"); // Este alerta não apareceu?
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObligations();
  }, [user?.company_id]);

  // Calcular estatísticas para os cards
  const totalObligations = obligations.length;
  const sentObligations = obligations.filter(
    (o) => o.status === "completed"
  ).length;
  const pendingObligations = obligations.filter(
    (o) => o.status === "pending"
  ).length;

  // Função chamada após adicionar uma nova obrigação
  const handleObligationAdded = () => {
    fetchObligations(); // Recarrega a lista
  };

  // Função para traduzir a periodicidade
  const getPeriodicityLabel = (periodicity: string) => {
    const labels: Record<string, string> = {
      monthly: "Mensal",
      bimonthly: "Bimestral",
      semestral: "Semestral",
      yearly: "Anual",
      unique: "Única",
    };
    return labels[periodicity] || periodicity;
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Obrigações Fiscais</h1>
        <p>Gerencie as obrigações fiscais dos seus clientes</p>
      </header>

      {/* Cards Estatísticos */}
      <div className="grid-cols-3">
        <StatCard
          title="Total de Obrigações"
          value={totalObligations}
          icon={<AlertTriangle size={24} />}
        />
        <StatCard
          title="Obrigações Enviadas"
          value={sentObligations}
          icon={<CheckCircle size={24} />}
          trend={{
            value: `${
              Math.round((sentObligations / totalObligations) * 100) || 0
            }% concluído`,
            isPositive: true,
          }}
        />
        <StatCard
          title="Obrigações Pendentes"
          value={pendingObligations}
          icon={<Clock size={24} />}
          trend={{
            value: `${
              Math.round((pendingObligations / totalObligations) * 100) || 0
            }% pendente`,
            isPositive: false,
          }}
        />
      </div>

      <section className="page-section">
        <div className="section-header">
          <h2>Lista de Obrigações</h2>
          <button onClick={() => setIsFormOpen(true)} className="btn-primary">
            <Plus size={18} />
            Nova Obrigação
          </button>
        </div>

        <div className="data-table">
          <div className="table-header">
            <span>Cliente</span>
            <span>Obrigação</span>
            <span>Vencimento</span>
            <span>Periodicidade</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : obligations.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} />
              <h3>Nenhuma obrigação cadastrada</h3>
              <p>Comece adicionando a primeira obrigação fiscal</p>
            </div>
          ) : (
            obligations.map((obligation) => (
              <div key={obligation.id} className="table-row">
                <span>
                  {obligation.clients?.name || "Cliente não encontrado"}
                </span>
                <span>{obligation.title}</span>
                <span>
                  {new Date(obligation.due_date).toLocaleDateString("pt-BR")}
                </span>
                <span>{getPeriodicityLabel(obligation.periodicity)}</span>
                <span className={`status-badge ${obligation.status}`}>
                  {obligation.status === "completed"
                    ? "Enviada"
                    : obligation.status === "overdue"
                    ? "Atrasada"
                    : "Pendente"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal do Formulário */}
      <ObligationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onObligationAdded={handleObligationAdded}
      />
    </div>
  );
};

export default Obligations;
