// src/pages/Login/Login.tsx (atualizado)
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LogIn, Mail, Lock, Info, Copy, Check } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login, isConnected } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!isConnected) {
      alert("Sistema offline. Não é possível fazer login.");
      return;
    }

    const { error } = await login(data.email, data.password);
    if (error) {
      alert("Erro ao fazer login: " + error.message);
    } else {
      navigate("/dashboard");
    }
  };

  const copyToClipboard = (text: string, field: "email" | "password") => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setValue(field, text);
    setTimeout(() => setCopied(false), 2000);
  };

  const fillTestCredentials = () => {
    setValue("email", "admin@empresaexemplo.com");
    setValue("password", "123456");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Entrar</h1>
          <p>Bem-vindo de volta! Por favor, faça login na sua conta.</p>
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

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Senha
            </label>
            <input
              {...register("password")}
              type="password"
              id="password"
              placeholder="Sua senha"
              className={errors.password ? "error" : ""}
            />
            {errors.password && (
              <span className="error">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isConnected}
            className="btn-primary auth-btn"
          >
            {isSubmitting ? (
              "Entrando..."
            ) : !isConnected ? (
              "Sistema Offline"
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Caixa de informações de teste */}
        <div className="test-credentials">
          <div className="test-credentials-header">
            <Info size={18} />
            <h3>Dados para Teste</h3>
          </div>

          <div className="test-credentials-content">
            <div className="credential-item">
              <span className="credential-label">E-mail:</span>
              <div className="credential-value">
                <code>admin@empresaexemplo.com</code>
                <button
                  onClick={() =>
                    copyToClipboard("admin@empresaexemplo.com", "email")
                  }
                  className="copy-btn"
                  title="Copiar e-mail"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="credential-item">
              <span className="credential-label">Senha:</span>
              <div className="credential-value">
                <code>123456</code>
                <button
                  onClick={() => copyToClipboard("123456", "password")}
                  className="copy-btn"
                  title="Copiar senha"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={fillTestCredentials}
            className="btn-secondary test-btn"
          >
            <LogIn size={16} />
            Preencher Automaticamente
          </button>
        </div>

        <div className="auth-options">
          <Link to="/esqueci-senha" className="auth-link">
            Esqueci minha senha
          </Link>
        </div>

        <div className="auth-footer">
          <p>
            Não tem uma conta?{" "}
            <Link to="/registro" className="auth-link">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
