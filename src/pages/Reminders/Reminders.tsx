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

// Função para enviar webhook - ADICIONADA
const sendReminderWebhook = async (
  reminderData: any,
  user: any,
  clients: any[]
) => {
  const webhookUrl =
    "https://n8nubuntu2025.kafuryprogramador.com.br/webhook-test/d0ee6f8d-499f-482d-ab8f-a4f22d7d0840";

  // Encontrar nome do cliente se existir
  const clientName = reminderData.client_id
    ? clients.find((c) => c.id === reminderData.client_id)?.name
    : null;

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
        client_name: clientName,
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
        source: "Reminders Dashboard",
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

    console.log("✅ Webhook enviado com sucesso!", payload);
    return { success: true, message: "Webhook enviado com sucesso" };
  } catch (error) {
    console.error("❌ Erro ao enviar webhook:", error);
    return { success: false, message: "Erro ao enviar webhook" };
  }
};

const Reminders: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]); // ADICIONADO
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" }); // ADICIONADO

  // Buscar lembretes
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

  // Buscar clientes - ADICIONADO
  const fetchClients = async () => {
    if (!user?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("company_id", user.company_id)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  useEffect(() => {
    fetchReminders();
    fetchClients(); // ADICIONADO
  }, [user?.company_id]);

  const totalReminders = reminders.length;
  const pendingReminders = reminders.filter(
    (r) => r.status === "pending"
  ).length;
  const completedReminders = reminders.filter(
    (r) => r.status === "completed"
  ).length;

  // Função atualizada para lidar com novo lembrete - MODIFICADA
  const handleReminderAdded = async (reminderData: any) => {
    try {
      // 1. Primeiro, inserir no banco de dados
      const insertData: any = {
        title: reminderData.title,
        description: reminderData.description || null,
        due_date: reminderData.due_date,
        company_id: user?.company_id,
        created_by: user?.id,
        status: "pending",
        priority: "medium",
      };

      // Adicionar client_id apenas se foi selecionado
      if (reminderData.client_id) {
        insertData.client_id = reminderData.client_id;
      }

      const { data: newReminder, error } = await supabase
        .from("reminders")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // 2. Enviar webhook em segundo plano
      if (newReminder && user) {
        setWebhookStatus({ type: null, message: "Enviando webhook..." });

        sendReminderWebhook(newReminder, user, clients)
          .then((result) => {
            setWebhookStatus({
              type: result.success ? "success" : "error",
              message: result.message,
            });

            // Limpar status após 5 segundos
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

      // 3. Atualizar a lista
      fetchReminders();

      return { success: true, data: newReminder };
    } catch (error: any) {
      console.error("Erro ao criar lembrete:", error);
      return { success: false, error: error.message };
    }
  };

  // Função para criar lembrete via formulário - MODIFICADA
  const handleFormSubmit = async (formData: any) => {
    const result = await handleReminderAdded(formData);

    if (result.success) {
      alert("Lembrete criado com sucesso!");
      setIsFormOpen(false);
    } else {
      alert(`Erro ao criar lembrete: ${result.error}`);
    }
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

      {/* Status do Webhook - ADICIONADO */}
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

      {/* ReminderForm atualizado para usar a nova função */}
      <ReminderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onReminderAdded={handleFormSubmit} // MODIFICADO
        clients={clients} // ADICIONADO para passar lista de clientes
      />
    </div>
  );
};

export default Reminders;
