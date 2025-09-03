// src/pages/Settings/Settings.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  Link as LinkIcon,
  Building,
  Copy,
  Check,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface CompanyFormData {
  companyName: string;
  email: string;
  phone: string;
  address: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );
  const [inviteEmail, setInviteEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>();

  const onSubmit = async (data: CompanyFormData) => {
    console.log("Company data:", data);
    // Aqui você salvaria no Supabase
  };

  const generateInviteLink = async () => {
    if (!user) return;

    setIsGenerating(true);
    setMessage(null);

    try {
      // Chamar a função RPC no Supabase para criar o convite
      const { data, error } = await supabase.rpc("create_invitation", {
        p_email: inviteEmail || "", // Usar o email do campo ou string vazia
        p_company_id: user.company_id,
        p_created_by: user.id,
      });

      if (error) {
        console.error("Erro ao criar convite:", error);
        setMessage({
          type: "error",
          text: "Erro ao gerar link de convite: " + error.message,
        });
        return;
      }

      // O token retornado pela função
      const token = data;
      const link = `${window.location.origin}/registro?invite=${token}`;

      setInviteLink(link);
      setMessage({
        type: "success",
        text: inviteEmail
          ? `Link de convite gerado com sucesso para ${inviteEmail}!`
          : "Link de convite gerado com sucesso!",
      });
    } catch (error) {
      console.error("Erro:", error);
      setMessage({ type: "error", text: "Erro inesperado ao gerar convite" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteLink) return;

    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Configurações</h1>
        <p>Gerencie as configurações da sua empresa</p>
      </header>

      {message && (
        <div
          className={`message ${
            message.type === "error" ? "error-message" : "success-message"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="settings-grid">
        {/* Formulário de Empresa */}
        <section className="settings-section">
          <h2>
            <Building size={20} />
            Informações da Empresa
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="form">
            <div className="form-group">
              <label htmlFor="companyName">Nome da Empresa</label>
              <input
                {...register("companyName", {
                  required: "Nome da empresa é obrigatório",
                })}
                type="text"
                id="companyName"
              />
              {errors.companyName && (
                <span className="error">{errors.companyName.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                {...register("email", {
                  required: "Email é obrigatório",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Email inválido",
                  },
                })}
                type="email"
                id="email"
              />
              {errors.email && (
                <span className="error">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefone</label>
              <input {...register("phone")} type="tel" id="phone" />
            </div>

            <div className="form-group">
              <label htmlFor="address">Endereço</label>
              <textarea {...register("address")} id="address" rows={3} />
            </div>

            <button type="submit" className="btn-primary">
              <Save size={18} />
              Salvar Alterações
            </button>
          </form>
        </section>

        {/* Gerar Link de Convite */}
        <section className="settings-section">
          <h2>
            <UserPlus size={20} />
            Gerenciar Convites
          </h2>
          <div className="invite-section">
            <p>Convide novos usuários para sua empresa:</p>

            <div className="form-group">
              <label htmlFor="inviteEmail">Email do Convidado (opcional)</label>
              <input
                type="email"
                id="inviteEmail"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <p className="input-note">
                Deixe em branco para gerar um link de convite universal
              </p>
            </div>

            <button
              onClick={generateInviteLink}
              className="btn-primary"
              disabled={isGenerating}
            >
              <LinkIcon size={18} />
              {isGenerating ? "Gerando..." : "Gerar Link de Convite"}
            </button>

            {inviteLink && (
              <div className="generated-link">
                <h3>Link gerado com sucesso!</h3>
                <p>Compartilhe este link com a pessoa que deseja convidar:</p>
                <div className="link-container">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="link-input"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="copy-btn"
                    title="Copiar link"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <div className="link-info">
                  <p className="link-note">⏰ Este link expira em 10 minutos</p>
                  <p className="link-note">
                    👥 Acesso:{" "}
                    {inviteEmail
                      ? "Convidado específico"
                      : "Qualquer pessoa com o link"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
