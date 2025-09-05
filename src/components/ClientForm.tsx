// src/components/ClientForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
  editingClient?: any;
}

const ClientForm: React.FC<ClientFormProps> = ({
  isOpen,
  onClose,
  onClientAdded,
  editingClient,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  React.useEffect(() => {
    if (editingClient) {
      setValue("name", editingClient.name);
      setValue("email", editingClient.email || "");
      setValue("phone", editingClient.phone || "");
    } else {
      reset();
    }
  }, [editingClient, reset, setValue]);

  const onSubmit = async (data: ClientFormData) => {
    if (!user?.company_id) return;

    setIsLoading(true);
    try {
      if (editingClient) {
        // Editar cliente existente
        const { error } = await supabase
          .from("clients")
          .update({
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingClient.id)
          .eq("company_id", user.company_id);

        if (error) throw error;
      } else {
        // Criar novo cliente
        const { error } = await supabase.from("clients").insert([
          {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            company_id: user.company_id,
            created_by: user.id,
            status: "active",
          },
        ]);

        if (error) throw error;
      }

      onClientAdded();
      onClose();
      reset();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{editingClient ? "Editar Cliente" : "Novo Cliente"}</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              {...register("name")}
              type="text"
              id="name"
              placeholder="Nome completo"
              className={errors.name ? "error" : ""}
            />
            {errors.name && (
              <span className="error">{errors.name.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              {...register("email")}
              type="email"
              id="email"
              placeholder="email@exemplo.com"
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="error">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              {...register("phone")}
              type="tel"
              id="phone"
              placeholder="(11) 99999-9999"
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && (
              <span className="error">{errors.phone.message}</span>
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
              {isLoading
                ? "Salvando..."
                : editingClient
                ? "Atualizar"
                : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
