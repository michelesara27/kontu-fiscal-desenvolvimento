// src/pages/ResetPassword/ResetPassword.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("Token inválido");
      return;
    }

    setIsLoading(true);
    try {
      // Verificar se o token é válido
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("reset_token", token)
        .gt("reset_token_expires", new Date().toISOString())
        .single();

      if (userError || !userData) {
        setError("Token inválido ou expirado");
        return;
      }

      // Atualizar senha
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: data.password, // Será criptografado pelo trigger
          reset_token: null,
          reset_token_expires: null,
        })
        .eq("id", userData.id);

      if (updateError) throw updateError;

      setIsSubmitted(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      setError("Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Token Inválido</h1>
            <p>O link de recuperação está incompleto ou inválido.</p>
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

  if (isSubmitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <CheckCircle size={48} className="success-icon" />
            <h1>Senha Redefinida!</h1>
            <p>
              Sua senha foi redefinida com sucesso. Redirecionando para o
              login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Redefinir Senha</h1>
          <p>Crie uma nova senha para sua conta</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Nova Senha
            </label>
            <input
              {...register("password")}
              type="password"
              id="password"
              placeholder="Sua nova senha"
              className={errors.password ? "error" : ""}
            />
            {errors.password && (
              <span className="error">{errors.password.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock size={18} />
              Confirmar Senha
            </label>
            <input
              {...register("confirmPassword")}
              type="password"
              id="confirmPassword"
              placeholder="Confirme sua nova senha"
              className={errors.confirmPassword ? "error" : ""}
            />
            {errors.confirmPassword && (
              <span className="error">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary auth-btn"
          >
            {isLoading ? "Redefinindo..." : "Redefinir Senha"}
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

export default ResetPassword;
