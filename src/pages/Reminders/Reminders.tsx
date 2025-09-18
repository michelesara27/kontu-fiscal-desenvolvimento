// src/pages/Reminders/Reminders.tsx
import React, { useEffect, useState } from "react";
import { Plus, Bell, Clock, Eye, Calendar } from "lucide-react";
import StatCard from "../../components/StatCard";
import ReminderForm from "../../components/ReminderForm";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  client_id: string;
  clients?: {
    name: string;
  };
}

const Reminders: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchReminders = async () => {
    if (!user?.company_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, clients(name)")
        .eq("company_id", user.company_id)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      alert("Erro ao carregar lembretes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user?.company_id]);

  const totalReminders = reminders.length;
  const pendingReminders = reminders.filter(
    (r) => r.status === "pending"
  ).length;
  const completedReminders = reminders.filter(
    (r) => r.status === "completed"
  ).length;

  const handleReminderAdded = () => {
    fetchReminders();
  };

  const truncateDescription = (description: string, maxLength: number = 50) => {
    if (!description) return "-";
    return description.length > maxLength
      ? description.substring(0, maxLength) + "..."
      : description;
  };

  const getStatusBadge = (status: string) => {
    return status === "completed" ? "Concluído" : "Pendente";
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Lembretes</h1>
        <p>Gerencie seus lembretes e notificações</p>
      </header>

      <div className="grid-cols-3">
        <StatCard
          title="Total de Lembretes"
          value={totalReminders}
          icon={<Bell size={24} />}
        />
        <StatCard
          title="Lembretes Pendentes"
          value={pendingReminders}
          icon={<Clock size={24} />}
        />
        <StatCard
          title="Lembretes Concluídos"
          value={completedReminders}
          icon={<Eye size={24} />}
        />
      </div>

      <section className="page-section">
        <div className="section-header">
          <h2>Todos os Lembretes</h2>
          <button onClick={() => setIsFormOpen(true)} className="btn-primary">
            <Plus size={18} />
            Novo Lembrete
          </button>
        </div>

        <div className="data-table">
          <div className="table-header">
            <span>Cliente</span>
            <span>Título</span>
            <span>Descrição</span>
            <span>Vencimento</span>
            <span>Status</span>
          </div>

          {loading ? (
            <div className="loading">Carregando...</div>
          ) : reminders.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <h3>Nenhum lembrete cadastrado</h3>
              <p>Comece adicionando seu primeiro lembrete</p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder.id} className="table-row">
                <span>
                  {reminder.clients?.name || "Cliente não encontrado"}
                </span>
                <span>{reminder.title}</span>
                <span title={reminder.description}>
                  {truncateDescription(reminder.description)}
                </span>
                <span>
                  <Calendar size={14} className="inline-icon" />
                  {new Date(reminder.due_date).toLocaleDateString("pt-BR")}
                </span>
                <span className={`status-badge ${reminder.status}`}>
                  {getStatusBadge(reminder.status)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <ReminderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onReminderAdded={handleReminderAdded}
      />
    </div>
  );
};

export default Reminders;
