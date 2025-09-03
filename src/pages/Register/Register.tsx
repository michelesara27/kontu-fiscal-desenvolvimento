// src/pages/Register/Register.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Building,
  ArrowLeft,
  Briefcase,
} from "lucide-react";

// Schema para registro com convite (apenas dados pessoais)
const inviteRegisterSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

// Schema para registro completo (empresa + admin)
const companyRegisterSchema = z.object({
  company: z.object({
    trade_name: z.string().min(1, "Nome fantasia é obrigatório"),
    email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
    phone: z.string().min(1, "Telefone é obrigatório"),
    cnpj: z.string().min(14, "CNPJ inválido"),
    address: z.string().min(1, "Endereço é obrigatório"),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    zip_code: z.string().min(8, "CEP inválido"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z
      .string()
      .min(2, "Estado é obrigatório")
      .max(2, "Use a sigla (ex: SP)"),
  }),
  user: z
    .object({
      name: z.string().min(1, "Nome é obrigatório"),
      email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "As senhas não coincidem",
      path: ["confirmPassword"],
    }),
});

type InviteRegisterFormData = z.infer<typeof inviteRegisterSchema>;
type CompanyRegisterFormData = z.infer<typeof companyRegisterSchema>;

const Register: React.FC = () => {
  const { register: registerUser, registerCompany, isConnected } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [invitationInfo, setInvitationInfo] = React.useState<any>(null);
  const [error, setError] = React.useState<string>("");

  const invitationToken = searchParams.get("invite");

  // Verificar convite ao carregar
  React.useEffect(() => {
    const checkInvitation = async () => {
      if (invitationToken) {
        try {
          const { data, error } = await fetchInvitationInfo();
          if (!error && data) {
            setInvitationInfo(data);
          } else {
            setError("Convite inválido ou expirado");
          }
        } catch (error) {
          console.error("Erro ao validar convite:", error);
          setError("Erro ao validar convite");
        }
      }
    };

    checkInvitation();
  }, [invitationToken]);

  const fetchInvitationInfo = async () => {
    // Simulação - na implementação real, você faria uma chamada à sua API
    return {
      data: {
        company_name: "Empresa Convite",
        invitation_email: "convite@empresa.com",
      },
      error: null,
    };
  };

  // Formulário para convite
  const {
    register: registerInviteForm,
    handleSubmit: handleInviteSubmit,
    formState: { errors: inviteErrors },
  } = useForm<InviteRegisterFormData>({
    resolver: zodResolver(inviteRegisterSchema),
  });

  // Formulário para empresa
  const {
    register: registerCompanyForm,
    handleSubmit: handleCompanySubmit,
    formState: { errors: companyErrors },
  } = useForm<CompanyRegisterFormData>({
    resolver: zodResolver(companyRegisterSchema),
  });

  const onSubmitInvite = async (data: InviteRegisterFormData) => {
    if (!isConnected) {
      alert("Sistema offline. Não é possível criar conta.");
      return;
    }

    if (!invitationToken) {
      setError("Token de convite não encontrado");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        invitationToken,
      });

      if (error) {
        setError(error.message);
      } else {
        alert("Conta criada com sucesso! Faça login.");
        navigate("/login");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitCompany = async (data: CompanyRegisterFormData) => {
    if (!isConnected) {
      alert("Sistema offline. Não é possível criar conta.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await registerCompany(data.company, {
        name: data.user.name,
        email: data.user.email,
        password: data.user.password,
      });

      if (error) {
        setError(error.message);
      } else {
        alert(
          "Empresa e conta administradora criadas com sucesso! Faça login."
        );
        navigate("/login");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar empresa");
    } finally {
      setIsLoading(false);
    }
  };

  if (invitationToken && error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Convite Inválido</h1>
            <p>{error}</p>
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
          <h1>
            {invitationToken ? (
              <>
                <Briefcase size={24} /> Complete seu Cadastro
              </>
            ) : (
              <>
                <Building size={24} /> Criar Empresa
              </>
            )}
          </h1>
          <p>
            {invitationToken
              ? `Você foi convidado para fazer parte da ${
                  invitationInfo?.company_name || "uma empresa"
                }`
              : "Crie sua empresa e sua conta de administrador"}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {invitationToken ? (
          // FORMULÁRIO DE CONVITE (apenas dados pessoais)
          <form
            onSubmit={handleInviteSubmit(onSubmitInvite)}
            className="auth-form"
          >
            <div className="form-group">
              <label htmlFor="name">
                <User size={18} />
                Nome Completo
              </label>
              <input
                {...registerInviteForm("name")}
                type="text"
                id="name"
                placeholder="Seu nome completo"
                className={inviteErrors.name ? "error" : ""}
              />
              {inviteErrors.name && (
                <span className="error">{inviteErrors.name.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email
              </label>
              <input
                {...registerInviteForm("email")}
                type="email"
                id="email"
                placeholder="seu@email.com"
                className={inviteErrors.email ? "error" : ""}
                defaultValue={invitationInfo?.invitation_email}
              />
              {inviteErrors.email && (
                <span className="error">{inviteErrors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={18} />
                Senha
              </label>
              <input
                {...registerInviteForm("password")}
                type="password"
                id="password"
                placeholder="Sua senha"
                className={inviteErrors.password ? "error" : ""}
              />
              {inviteErrors.password && (
                <span className="error">{inviteErrors.password.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={18} />
                Confirmar Senha
              </label>
              <input
                {...registerInviteForm("confirmPassword")}
                type="password"
                id="confirmPassword"
                placeholder="Confirme sua senha"
                className={inviteErrors.confirmPassword ? "error" : ""}
              />
              {inviteErrors.confirmPassword && (
                <span className="error">
                  {inviteErrors.confirmPassword.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isConnected}
              className="btn-primary auth-btn"
            >
              {isLoading ? (
                "Cadastrando..."
              ) : !isConnected ? (
                "Sistema Offline"
              ) : (
                <>
                  <UserPlus size={18} />
                  Completar Cadastro
                </>
              )}
            </button>
          </form>
        ) : (
          // FORMULÁRIO COMPLETO (empresa + admin)
          <form
            onSubmit={handleCompanySubmit(onSubmitCompany)}
            className="auth-form"
          >
            <div className="section-header">
              <Building size={20} />
              <h3>Dados da Empresa</h3>
            </div>

            <div className="form-group">
              <label htmlFor="trade_name">Nome Fantasia *</label>
              <input
                {...registerCompanyForm("company.trade_name")}
                type="text"
                id="trade_name"
                placeholder="Nome da sua empresa"
                className={companyErrors.company?.trade_name ? "error" : ""}
              />
              {companyErrors.company?.trade_name && (
                <span className="error">
                  {companyErrors.company.trade_name.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="company_email">Email da Empresa *</label>
              <input
                {...registerCompanyForm("company.email")}
                type="email"
                id="company_email"
                placeholder="empresa@email.com"
                className={companyErrors.company?.email ? "error" : ""}
              />
              {companyErrors.company?.email && (
                <span className="error">
                  {companyErrors.company.email.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefone *</label>
              <input
                {...registerCompanyForm("company.phone")}
                type="tel"
                id="phone"
                placeholder="(11) 99999-9999"
                className={companyErrors.company?.phone ? "error" : ""}
              />
              {companyErrors.company?.phone && (
                <span className="error">
                  {companyErrors.company.phone.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="cnpj">CNPJ *</label>
              <input
                {...registerCompanyForm("company.cnpj")}
                type="text"
                id="cnpj"
                placeholder="00.000.000/0000-00"
                className={companyErrors.company?.cnpj ? "error" : ""}
              />
              {companyErrors.company?.cnpj && (
                <span className="error">
                  {companyErrors.company.cnpj.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address">Endereço *</label>
              <input
                {...registerCompanyForm("company.address")}
                type="text"
                id="address"
                placeholder="Rua, número"
                className={companyErrors.company?.address ? "error" : ""}
              />
              {companyErrors.company?.address && (
                <span className="error">
                  {companyErrors.company.address.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="neighborhood">Bairro *</label>
              <input
                {...registerCompanyForm("company.neighborhood")}
                type="text"
                id="neighborhood"
                placeholder="Bairro"
                className={companyErrors.company?.neighborhood ? "error" : ""}
              />
              {companyErrors.company?.neighborhood && (
                <span className="error">
                  {companyErrors.company.neighborhood.message}
                </span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="zip_code">CEP *</label>
                <input
                  {...registerCompanyForm("company.zip_code")}
                  type="text"
                  id="zip_code"
                  placeholder="00000-000"
                  className={companyErrors.company?.zip_code ? "error" : ""}
                />
                {companyErrors.company?.zip_code && (
                  <span className="error">
                    {companyErrors.company.zip_code.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="city">Cidade *</label>
                <input
                  {...registerCompanyForm("company.city")}
                  type="text"
                  id="city"
                  placeholder="Cidade"
                  className={companyErrors.company?.city ? "error" : ""}
                />
                {companyErrors.company?.city && (
                  <span className="error">
                    {companyErrors.company.city.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="state">Estado *</label>
                <input
                  {...registerCompanyForm("company.state")}
                  type="text"
                  id="state"
                  placeholder="SP"
                  maxLength={2}
                  className={companyErrors.company?.state ? "error" : ""}
                />
                {companyErrors.company?.state && (
                  <span className="error">
                    {companyErrors.company.state.message}
                  </span>
                )}
              </div>
            </div>

            <div className="section-header">
              <User size={20} />
              <h3>Dados do Administrador</h3>
            </div>

            <div className="form-group">
              <label htmlFor="user_name">Nome Completo *</label>
              <input
                {...registerCompanyForm("user.name")}
                type="text"
                id="user_name"
                placeholder="Seu nome completo"
                className={companyErrors.user?.name ? "error" : ""}
              />
              {companyErrors.user?.name && (
                <span className="error">{companyErrors.user.name.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="user_email">Email *</label>
              <input
                {...registerCompanyForm("user.email")}
                type="email"
                id="user_email"
                placeholder="seu@email.com"
                className={companyErrors.user?.email ? "error" : ""}
              />
              {companyErrors.user?.email && (
                <span className="error">
                  {companyErrors.user.email.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="user_password">Senha *</label>
              <input
                {...registerCompanyForm("user.password")}
                type="password"
                id="user_password"
                placeholder="Sua senha"
                className={companyErrors.user?.password ? "error" : ""}
              />
              {companyErrors.user?.password && (
                <span className="error">
                  {companyErrors.user.password.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="user_confirmPassword">Confirmar Senha *</label>
              <input
                {...registerCompanyForm("user.confirmPassword")}
                type="password"
                id="user_confirmPassword"
                placeholder="Confirme sua senha"
                className={companyErrors.user?.confirmPassword ? "error" : ""}
              />
              {companyErrors.user?.confirmPassword && (
                <span className="error">
                  {companyErrors.user.confirmPassword.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isConnected}
              className="btn-primary auth-btn"
            >
              {isLoading ? (
                "Criando Empresa..."
              ) : !isConnected ? (
                "Sistema Offline"
              ) : (
                <>
                  <Building size={18} />
                  Criar Empresa e Conta
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Já tem uma conta?{" "}
            <Link to="/login" className="auth-link">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
