// src/pages/ForgotPassword/ForgotPassword.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      // Gerar token de recuperação
      const resetToken = Math.random().toString(36).substr(2, 15);
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora

      // Salvar token no usuário
      const { error } = await supabase
        .from("users")
        .update({
          reset_token: resetToken,
          reset_token_expires: resetTokenExpires.toISOString(),
        })
        .eq("email", data.email);

      if (error) throw error;

      // Aqui você enviaria o email com o link de recuperação
      // Exemplo: https://seusite.com/redefinir-senha?token=abc123
      console.log(
        "Link de recuperação:",
        `${window.location.origin}/redefinir-senha?token=${resetToken}`
      );

      setIsSubmitted(true);
    } catch (error) {
      alert("Erro ao solicitar recuperação de senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <CheckCircle size={48} className="success-icon" />
            <h1>Email Enviado!</h1>
            <p>
              Enviamos instruções para redefinir sua senha para o email
              informado.
            </p>
          </div>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              <ArrowLeft size={16} />
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Recuperar Senha</h1>
          <p>Informe seu email para receber instruções de recuperação</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              placeholder="seu@email.com"
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="error">{errors.email.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary auth-btn"
          >
            {isLoading ? "Enviando..." : "Enviar Instruções"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            <ArrowLeft size={16} />
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
