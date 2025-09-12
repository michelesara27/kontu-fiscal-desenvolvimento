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
  Mail,
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
  const [inviteType, setInviteType] = useState<"universal" | "specific">(
    "universal"
  );

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
      let result;

      if (inviteType === "specific") {
        if (!inviteEmail) {
          setMessage({
            type: "error",
            text: "Email é obrigatório para convite específico",
          });
          setIsGenerating(false);
          return;
        }

        // Convite específico com email
        result = await supabase.rpc("create_invitation", {
          p_email: inviteEmail,
          p_company_id: user.company_id,
          p_created_by: user.id,
        });
      } else {
        // Convite universal
        result = await supabase.rpc("create_universal_invitation", {
          p_company_id: user.company_id,
          p_created_by: user.id,
        });
      }

      if (result.error) {
        console.error("Erro ao criar convite:", result.error);
        setMessage({
          type: "error",
          text: "Erro ao gerar link de convite: " + result.error.message,
        });
        setIsGenerating(false);
        return;
      }

      // O token retornado pela função
      const token = result.data;
      const link = `${window.location.origin}/registro?invite=${token}`;

      setInviteLink(link);
      setMessage({
        type: "success",
        text:
          inviteType === "specific"
            ? `Link de convite gerado com sucesso para ${inviteEmail}!`
            : "Link de convite universal gerado com sucesso! Qualquer pessoa pode se registrar com este link.",
      });
    } catch (error: any) {
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
              <label>Tipo de Convite</label>
              <div className="invite-type-selector">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="universal"
                    checked={inviteType === "universal"}
                    onChange={(e) =>
                      setInviteType(e.target.value as "universal" | "specific")
                    }
                  />
                  <span>Convite Universal (Qualquer email)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="specific"
                    checked={inviteType === "specific"}
                    onChange={(e) =>
                      setInviteType(e.target.value as "universal" | "specific")
                    }
                  />
                  <span>Convite Específico</span>
                </label>
              </div>
            </div>

            {inviteType === "specific" && (
              <div className="form-group">
                <label htmlFor="inviteEmail">
                  <Mail size={16} />
                  Email do Convidado *
                </label>
                <input
                  type="email"
                  id="inviteEmail"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <p className="input-note">
                  O convite só funcionará para este email específico
                </p>
              </div>
            )}

            {inviteType === "universal" && (
              <div className="info-box">
                <strong>Convite Universal</strong>
                <p>
                  Qualquer pessoa com este link poderá se registrar na sua
                  empresa.
                </p>
              </div>
            )}

            <button
              onClick={generateInviteLink}
              className="btn-primary"
              disabled={
                isGenerating || (inviteType === "specific" && !inviteEmail)
              }
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
                  <p className="link-note">
                    ⏰ Este link expira em{" "}
                    {inviteType === "specific" ? "10 minutos" : "24 horas"}
                  </p>
                  <p className="link-note">
                    👥 Acesso:{" "}
                    {inviteType === "universal"
                      ? "Qualquer pessoa com o link"
                      : `Apenas para: ${inviteEmail}`}
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
