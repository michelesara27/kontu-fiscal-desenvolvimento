import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Calendar, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Pendency } from "../lib/supabase";

const obligationSchema = z.object({
  client_id: z.string().min(1, "Selecionar um cliente é obrigatório"),
  title: z.string().min(1, "Nome da obrigação é obrigatório"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  periodicity: z
    .string()
    .min(1, "Selecione a periodicidade")
    .refine(
      (value) =>
        ["monthly", "bimonthly", "semestral", "yearly", "unique"].includes(
          value
        ),
      "Selecione uma periodicidade válida"
    ),
});

type ObligationFormData = z.infer<typeof obligationSchema>;

interface ObligationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onObligationAdded: () => void;
  editingObligation?: Pendency;
}

const ObligationForm: React.FC<ObligationFormProps> = ({
  isOpen,
  onClose,
  onObligationAdded,
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
  } = useForm<ObligationFormData>({
    resolver: zodResolver(obligationSchema),
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

  const onSubmit = async (data: ObligationFormData) => {
    if (!user?.company_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("pendencies").insert([
        {
          title: data.title,
          due_date: data.due_date,
          periodicity: data.periodicity,
          client_id: data.client_id,
          company_id: user.company_id,
          created_by: user.id,
          status: "pending",
          priority: "medium",
        },
      ]);

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        throw new Error(error.message || "Erro desconhecido do banco de dados");
      }

      onObligationAdded();
      onClose();
      reset();
      alert("Obrigação fiscal salva com sucesso!");
    } catch (error: any) {
      console.error("Erro completo ao salvar obrigação:", error);
      alert(
        `Erro ao salvar obrigação fiscal: ${
          error.message || "Verifique o console para detalhes"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Nova Obrigação Fiscal</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
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
            <label htmlFor="title">Nome da Obrigação Fiscal *</label>
            <input
              {...register("title")}
              type="text"
              id="title"
              placeholder="Ex: Declaração de IRPF, DAS, etc."
              className={errors.title ? "error" : ""}
              disabled={isLoading}
            />
            {errors.title && (
              <span className="error">{errors.title.message}</span>
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

          <div className="form-group">
            <label htmlFor="periodicity">Periodicidade *</label>
            <select
              {...register("periodicity")}
              id="periodicity"
              className={errors.periodicity ? "error" : ""}
              disabled={isLoading}
            >
              <option value="">Selecione a periodicidade</option>
              <option value="unique">Única</option>
              <option value="monthly">Mensal</option>
              <option value="bimonthly">Bimestral</option>
              <option value="semestral">Semestral</option>
              <option value="yearly">Anual</option>
            </select>
            {errors.periodicity && (
              <span className="error">{errors.periodicity.message}</span>
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
              {isLoading ? "Salvando..." : "Criar Obrigação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ObligationForm;
