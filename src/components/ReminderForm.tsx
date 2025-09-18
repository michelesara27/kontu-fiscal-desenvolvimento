// src/components/ReminderForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Calendar, User, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const reminderSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  client_id: z.string().min(1, "Selecionar um cliente é obrigatório"),
  description: z.string().optional(),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onReminderAdded: () => void;
}

const ReminderForm: React.FC<ReminderFormProps> = ({
  isOpen,
  onClose,
  onReminderAdded,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [clients, setClients] = React.useState<{ id: string; name: string }[]>(
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
  });

  React.useEffect(() => {
    const fetchClients = async () => {
      if (!user?.company_id || !isOpen) return;
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
        alert("Erro ao carregar lista de clientes");
      }
    };
    fetchClients();
  }, [user?.company_id, isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: ReminderFormData) => {
    if (!user?.company_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("reminders").insert([
        {
          title: data.title,
          description: data.description || null,
          due_date: data.due_date,
          client_id: data.client_id,
          company_id: user.company_id,
          created_by: user.id,
          status: "pending",
          priority: "medium",
        },
      ]);

      if (error) throw error;

      onReminderAdded();
      onClose();
      reset();
      alert("Lembrete criado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar lembrete:", error);
      alert(`Erro ao salvar lembrete: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Novo Lembrete</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">
              <FileText size={18} />
              Título *
            </label>
            <input
              {...register("title")}
              type="text"
              id="title"
              placeholder="Título do lembrete"
              className={errors.title ? "error" : ""}
              disabled={isLoading}
            />
            {errors.title && (
              <span className="error">{errors.title.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="client_id">
              <User size={18} />
              Cliente *
            </label>
            <select
              {...register("client_id")}
              id="client_id"
              className={errors.client_id ? "error" : ""}
              disabled={isLoading}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <span className="error">{errors.client_id.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <FileText size={18} />
              Descrição
            </label>
            <textarea
              {...register("description")}
              id="description"
              placeholder="Descrição do lembrete"
              rows={3}
              className={errors.description ? "error" : ""}
              disabled={isLoading}
            />
            {errors.description && (
              <span className="error">{errors.description.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="due_date">
              <Calendar size={18} />
              Data de Vencimento *
            </label>
            <input
              {...register("due_date")}
              type="date"
              id="due_date"
              className={errors.due_date ? "error" : ""}
              disabled={isLoading}
            />
            {errors.due_date && (
              <span className="error">{errors.due_date.message}</span>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              <Save size={18} />
              {isLoading ? "Salvando..." : "Criar Lembrete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderForm;
