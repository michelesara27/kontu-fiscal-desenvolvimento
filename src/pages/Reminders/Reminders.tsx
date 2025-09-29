// src/pages/Reminders/Reminders.tsx
import React, { useEffect, useState } from "react";
import { Plus, Bell, Clock, Eye, Calendar, Trash2 } from "lucide-react";
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
  client_name: string;
  company_name: string;
  clients?: {
    name: string;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Company {
  id: string;
  trade_name: string;
}

// Função para enviar webhook (CORRIGIDA)
const sendReminderWebhook = async (
  reminderData: any,
  user: any,
  clientEmail?: string
) => {
  const webhookUrl = "https://kontu-lembretes.michelesara27.workers.dev/";

  const payload = {
    event_type: "reminder_created",
    timestamp: new Date().toISOString(),
    data: {
      reminder: {
        id: reminderData.id,
        title: reminderData.title,
        description: reminderData.description,
        due_date: reminderData.due_date,
        status: reminderData.status,
        priority: reminderData.priority,
        client_id: reminderData.client_id,
        client_name: reminderData.client_name,
        client_email: clientEmail,
        company_name: reminderData.company_name,
        company_id: reminderData.company_id,
        created_by: reminderData.created_by,
        created_at: reminderData.created_at,
      },
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        company_id: user?.company_id,
      },
      system: {
        name: "Kontu Fiscal",
        version: "1.0.0",
      },
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("✅ Webhook enviado com sucesso!");
    return { success: true, message: "Webhook enviado com sucesso" };
  } catch (error) {
    console.error("❌ Erro ao enviar webhook:", error);
    return { success: false, message: "Erro ao enviar webhook" };
  }
};

const Reminders: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReminders = async () => {
    if (!user?.company_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, clients(name)")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      alert("Erro ao carregar lembretes");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!user?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone")
        .eq("company_id", user.company_id)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  // Buscar dados da empresa
  const fetchCompany = async () => {
    if (!user?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, trade_name")
        .eq("id", user.company_id)
        .single();

      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error("Erro ao buscar dados da empresa:", error);
    }
  };

  useEffect(() => {
    fetchReminders();
    fetchClients();
    fetchCompany();
  }, [user?.company_id]);

  const totalReminders = reminders.length;
  const pendingReminders = reminders.filter(
    (r) => r.status === "pending"
  ).length;
  const completedReminders = reminders.filter(
    (r) => r.status === "completed"
  ).length;

  const getClientEmail = (clientId: string): string => {
    const client = clients.find((c) => c.id === clientId);
    return client?.email || "";
  };

  // Excluir lembrete
  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lembrete?")) {
      return;
    }

    setDeletingId(reminderId);
    try {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderId)
        .eq("company_id", user?.company_id);

      if (error) throw error;

      setReminders((prev) =>
        prev.filter((reminder) => reminder.id !== reminderId)
      );
      alert("Lembrete excluído com sucesso!");
    } catch (error: any) {
      console.error("Erro ao excluir lembrete:", error);
      alert("Erro ao excluir lembrete: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Marcar como concluído
  const handleToggleStatus = async (
    reminderId: string,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === "pending" ? "completed" : "pending";

      const { error } = await supabase
        .from("reminders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminderId)
        .eq("company_id", user?.company_id);

      if (error) throw error;

      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === reminderId
            ? { ...reminder, status: newStatus as "pending" | "completed" }
            : reminder
        )
      );

      alert(
        `Lembrete ${
          newStatus === "completed" ? "concluído" : "reaberto"
        } com sucesso!`
      );
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar lembrete: " + error.message);
    }
  };

  const processNewReminder = async (clientEmail?: string) => {
    if (!user?.company_id) return;

    try {
      const { data: newReminder, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (newReminder) {
        setWebhookStatus({ type: null, message: "Enviando webhook..." });

        // CORREÇÃO: Removido clients do parâmetro
        sendReminderWebhook(newReminder, user, clientEmail)
          .then((result) => {
            setWebhookStatus({
              type: result.success ? "success" : "error",
              message: result.message,
            });

            setTimeout(() => {
              setWebhookStatus({ type: null, message: "" });
            }, 5000);
          })
          .catch((error) => {
            console.error("Erro no webhook:", error);
            setWebhookStatus({
              type: "error",
              message: "Falha ao enviar webhook",
            });
          });
      }

      return { success: true, data: newReminder };
    } catch (error: any) {
      console.error("Erro ao processar lembrete:", error);
      return { success: false, error: error.message };
    }
  };

  const handleFormSuccess = async (clientId?: string) => {
    const clientEmail = clientId ? getClientEmail(clientId) : undefined;
    await processNewReminder(clientEmail);
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

  const getStatusColor = (status: string) => {
    return status === "completed" ? "completed" : "pending";
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Lembretes</h1>
        <p>Gerencie seus lembretes e notificações</p>
      </header>

      {webhookStatus.type && (
        <div className={`webhook-status ${webhookStatus.type}`}>
          {webhookStatus.type === "success" ? "✅ " : "❌ "}
          {webhookStatus.message}
        </div>
      )}

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
            <span>Ações</span>
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
                <span title={reminder.client_name || reminder.clients?.name}>
                  {reminder.client_name ||
                    reminder.clients?.name ||
                    "Cliente não encontrado"}
                </span>
                <span>{reminder.title}</span>
                <span title={reminder.description}>
                  {truncateDescription(reminder.description)}
                </span>
                <span>
                  <Calendar size={14} className="inline-icon" />
                  {new Date(reminder.due_date).toLocaleDateString("pt-BR")}
                </span>
                <span>
                  <button
                    onClick={() =>
                      handleToggleStatus(reminder.id, reminder.status)
                    }
                    className={`status-badge ${getStatusColor(
                      reminder.status
                    )} clickable`}
                    title={
                      reminder.status === "completed"
                        ? "Marcar como pendente"
                        : "Marcar como concluído"
                    }
                  >
                    {getStatusBadge(reminder.status)}
                  </button>
                </span>
                <span className="actions">
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="icon-btn danger"
                    disabled={deletingId === reminder.id}
                    title="Excluir lembrete"
                  >
                    {deletingId === reminder.id ? (
                      <div className="loading-spinner-small"></div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <ReminderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onReminderAdded={handleFormSuccess}
        clients={clients}
        companyName={company?.trade_name || ""}
      />
    </div>
  );
};

export default Reminders;
