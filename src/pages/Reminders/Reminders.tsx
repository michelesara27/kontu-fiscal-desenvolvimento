// src/pages/Reminders/Reminders.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Bell, Clock } from "lucide-react"; // Removido CheckCircle
import StatCard from "../../components/StatCard";
import { supabase } from "../../lib/supabase";

interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
}

const Reminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingReminders = reminders.filter(
    (r) => r.status === "pending"
  ).length;
  const highPriority = reminders.filter(
    (r) => r.priority === "high" && r.status === "pending"
  ).length;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Lembretes</h1>
        <p>Gerencie seus lembretes e notificações</p>
      </header>

      <div className="grid-cols-3">
        <StatCard
          title="Total de Lembretes"
          value={reminders.length}
          icon={<Bell size={24} />}
        />
        <StatCard
          title="Lembretes Pendentes"
          value={pendingReminders}
          icon={<Clock size={24} />}
        />
        <StatCard
          title="Alta Prioridade"
          value={highPriority}
          icon={<Bell size={24} />}
        />
      </div>

      <section className="page-section">
        <div className="section-header">
          <h2>Todos os Lembretes</h2>
          <Link to="/novo-lembrete" className="btn-primary">
            <Plus size={18} />
            Novo Lembrete
          </Link>
        </div>

        <div className="data-table">
          <div className="table-header">
            <span>Título</span>
            <span>Descrição</span>
            <span>Vencimento</span>
            <span>Prioridade</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder.id} className="table-row">
                <span>{reminder.title}</span>
                <span>{reminder.description}</span>
                <span>{new Date(reminder.due_date).toLocaleDateString()}</span>
                <span className={`priority-badge ${reminder.priority}`}>
                  {reminder.priority}
                </span>
                <span className={`status-badge ${reminder.status}`}>
                  {reminder.status === "pending" ? "Pendente" : "Concluído"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Reminders;
