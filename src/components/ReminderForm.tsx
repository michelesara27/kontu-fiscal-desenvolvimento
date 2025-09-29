// src/components/ReminderForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Save,
  Calendar,
  User,
  FileText,
  Mail,
  Building,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const reminderSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  client_id: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  client_email: z.string().optional(),
  client_name: z.string().optional(), // ← NOVO CAMPO
  company_name: z.string().optional(), // ← NOVO CAMPO
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onReminderAdded: (clientId?: string) => void;
  clients?: { id: string; name: string; email: string }[];
  companyName?: string; // ← NOVA PROP
}

const ReminderForm: React.FC<ReminderFormProps> = ({
  isOpen,
  onClose,
  onReminderAdded,
  clients = [],
  companyName = "",
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedClientEmail, setSelectedClientEmail] = React.useState("");
  const [selectedClientName, setSelectedClientName] = React.useState(""); // ← NOVO STATE

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      client_id: "",
      client_email: "",
      client_name: "",
      company_name: companyName, // ← VALOR PADRÃO
    },
  });

  // Observar mudanças no select de cliente
  const selectedClientId = watch("client_id");

  // Efeito para atualizar email e nome quando cliente for selecionado
  React.useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId);
      const clientEmail = client?.email || "";
      const clientName = client?.name || "";

      setSelectedClientEmail(clientEmail);
      setSelectedClientName(clientName);

      setValue("client_email", clientEmail);
      setValue("client_name", clientName); // ← SETANDO NOME DO CLIENTE
    } else {
      setSelectedClientEmail("");
      setSelectedClientName("");
      setValue("client_email", "");
      setValue("client_name", "");
    }
  }, [selectedClientId, clients, setValue]);

  // Efeito para setar o nome da empresa
  React.useEffect(() => {
    if (companyName) {
      setValue("company_name", companyName);
    }
  }, [companyName, setValue]);

  React.useEffect(() => {
    if (!isOpen) {
      reset();
      setValue("client_id", "");
      setValue("client_email", "");
      setValue("client_name", "");
      setValue("company_name", companyName);
      setSelectedClientEmail("");
      setSelectedClientName("");
    }
  }, [isOpen, reset, setValue, companyName]);

  const onSubmit = async (data: ReminderFormData) => {
    if (!user?.company_id) return;

    setIsLoading(true);
    try {
      // Preparar dados para inserção
      const insertData: any = {
        title: data.title,
        description: data.description || null,
        due_date: data.due_date,
        company_id: user.company_id,
        created_by: user.id,
        status: "pending",
        priority: "medium",
        client_name: data.client_name || null, // ← NOVO CAMPO
        company_name: data.company_name || null, // ← NOVO CAMPO
      };

      // Adicionar client_id apenas se foi selecionado
      if (data.client_id) {
        insertData.client_id = data.client_id;
      }

      const { error } = await supabase
        .from("reminders")
        .insert([insertData])
        .select();

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        throw error;
      }

      onReminderAdded(data.client_id);
      onClose();
      reset();
      alert("Lembrete criado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar lembrete:", error);
      alert(`Erro ao criar lembrete: ${error.message}`);
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
          <button
            onClick={onClose}
            className="modal-close"
            disabled={isLoading}
          >
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
              Cliente (Opcional)
            </label>
            <select
              {...register("client_id")}
              id="client_id"
              className={errors.client_id ? "error" : ""}
              disabled={isLoading || clients.length === 0}
            >
              <option value="">Selecione um cliente (opcional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.email ? `(${client.email})` : ""}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <span className="error">{errors.client_id.message}</span>
            )}
            {clients.length === 0 && (
              <span className="text-sm text-muted-foreground">
                Nenhum cliente cadastrado
              </span>
            )}
          </div>

          {/* Campos hidden para dados do cliente e empresa */}
          <input
            type="hidden"
            {...register("client_email")}
            value={selectedClientEmail}
          />
          <input
            type="hidden"
            {...register("client_name")}
            value={selectedClientName}
          />
          <input
            type="hidden"
            {...register("company_name")}
            value={companyName}
          />

          {/* Informações do cliente selecionado */}
          {selectedClientName && (
            <div className="client-info">
              <div className="client-info-item">
                <User size={16} />
                <span>
                  Cliente: <strong>{selectedClientName}</strong>
                </span>
              </div>
              {selectedClientEmail && (
                <div className="client-info-item">
                  <Mail size={16} />
                  <span>
                    E-mail: <strong>{selectedClientEmail}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Informação da empresa */}
          {companyName && (
            <div className="company-info">
              <Building size={16} />
              <span>
                Empresa: <strong>{companyName}</strong>
              </span>
            </div>
          )}

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
