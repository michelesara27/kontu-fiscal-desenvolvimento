// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "collaborator";
  company_id?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isConnected: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ error: any; user?: AppUser }>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<{ error: any }>;
  registerCompany: (
    companyData: CompanyRegisterData,
    userData: UserRegisterData
  ) => Promise<{ error: any }>;
  requestPasswordReset: (
    email: string
  ) => Promise<{ error: any; token?: string }>;
  resetPassword: (
    token: string,
    newPassword: string
  ) => Promise<{ error: any }>;
  validateResetToken: (
    token: string
  ) => Promise<{ error: any; isValid?: boolean; email?: string }>;
  loginWithGoogle: () => Promise<{ error: any }>; // ← ADICIONADO
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  invitationToken?: string;
}

interface CompanyRegisterData {
  trade_name: string;
  email: string;
  phone: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  zip_code: string;
  city: string;
  state: string;
}

interface UserRegisterData {
  name: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Erro ao carregar usuário do localStorage:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from("users").select("count").limit(1);
      setIsConnected(!error);
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setIsConnected(false);
    }
  };

  // ADICIONADO: Função loginWithGoogle
  const loginWithGoogle = async (): Promise<{ error: any }> => {
    try {
      if (!isConnected) {
        return { error: { message: "Sem conexão com o banco de dados" } };
      }

      // Implementação básica do Google Login
      // Para uma implementação completa, você precisaria configurar OAuth no Supabase
      console.log("Google Login solicitado - implementação em desenvolvimento");

      // Simulação temporária - redireciona para login normal
      return {
        error: {
          message: "Login com Google em desenvolvimento. Use login com email.",
        },
      };

      // Implementação futura com OAuth:
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: 'google',
      // });

      // if (error) throw error;

      // return { error: null };
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      return {
        error: { message: error.message || "Erro no login com Google" },
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (!isConnected) {
        return { error: { message: "Sem conexão com o banco de dados" } };
      }

      const { data, error } = await supabase.rpc("authenticate_user", {
        p_email: email,
        p_password: password,
      });

      if (error) {
        console.error("Erro na autenticação:", error);
        return { error: { message: "Email ou senha inválidos" } };
      }

      if (data && data.length > 0 && data[0].is_authenticated) {
        const userData = data[0];

        // Buscar informações completas do usuário
        const { data: userInfo, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userData.user_id)
          .single();

        if (userError || !userInfo) {
          return { error: { message: "Usuário não encontrado" } };
        }

        const user: AppUser = {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          role: userInfo.role,
          company_id: userInfo.company_id,
          is_active: userInfo.is_active,
        };

        if (!user.is_active) {
          return { error: { message: "Usuário desativado" } };
        }

        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));

        return { error: null, user };
      } else {
        return { error: { message: "Email ou senha inválidos" } };
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      return { error: { message: error.message || "Erro ao fazer login" } };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      if (!isConnected) {
        return { error: { message: "Sem conexão com o banco de dados" } };
      }

      // Se tem token de convite, validar e obter company_id
      if (userData.invitationToken) {
        const { data: invitationData, error: invitationError } =
          await supabase.rpc("validate_invitation_simple", {
            p_token: userData.invitationToken,
          });

        if (invitationError || !invitationData || invitationData.length === 0) {
          return { error: { message: "Convite inválido ou expirado" } };
        }

        const invitation = invitationData[0];
        if (!invitation.is_valid) {
          return { error: { message: "Convite inválido ou expirado" } };
        }

        // Marcar convite como usado
        await supabase
          .from("invitations")
          .update({ used: true })
          .eq("token", userData.invitationToken);
      } else {
        return {
          error: {
            message:
              "Token de convite é obrigatório para registro de colaborador",
          },
        };
      }

      // Usar função RPC para bypass do RLS
      const { error } = await supabase.rpc("register_user_with_invite", {
        user_name: userData.name,
        user_email: userData.email,
        user_password: userData.password,
        invitation_token: userData.invitationToken,
      });

      if (error) {
        console.error("Erro RPC register_user_with_invite:", error);

        if (error.message?.includes("já cadastrado")) {
          return { error: { message: "Email já cadastrado" } };
        }
        if (error.message?.includes("Convite inválido")) {
          return { error: { message: "Convite inválido ou expirado" } };
        }

        throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error("Erro no registro:", error);
      return { error: { message: error.message || "Erro ao criar conta" } };
    }
  };

  const registerCompany = async (
    companyData: CompanyRegisterData,
    userData: UserRegisterData
  ) => {
    try {
      if (!isConnected) {
        return { error: { message: "Sem conexão com o banco de dados" } };
      }

      // Usar função RPC para bypass do RLS
      const { error } = await supabase.rpc("register_company_and_admin", {
        company_trade_name: companyData.trade_name,
        company_email: companyData.email,
        company_phone: companyData.phone,
        company_cnpj: companyData.cnpj,
        company_address: companyData.address,
        company_neighborhood: companyData.neighborhood,
        company_zip_code: companyData.zip_code,
        company_city: companyData.city,
        company_state: companyData.state,
        user_name: userData.name,
        user_email: userData.email,
        user_password: userData.password,
      });

      if (error) {
        console.error("Erro RPC register_company_and_admin:", error);

        // Tratamento específico de erros
        if (
          error.message?.includes("CNPJ já cadastrado") ||
          error.code === "23505"
        ) {
          return { error: { message: "CNPJ já cadastrado" } };
        }
        if (
          error.message?.includes("Email já cadastrado") ||
          error.code === "23505"
        ) {
          return { error: { message: "Email já cadastrado" } };
        }
        if (error.message?.includes("CNPJ inválido")) {
          return { error: { message: "CNPJ inválido" } };
        }
        if (error.message?.includes("CEP inválido")) {
          return { error: { message: "CEP inválido" } };
        }
        if (error.code === "42501") {
          // Fallback para método direto se RLS bloquear
          return await registerCompanyDirect(companyData, userData);
        }

        throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error("Erro no registro da empresa:", error);

      // Fallback para método direto
      if (
        error.code === "42501" ||
        error.message?.includes("row-level security")
      ) {
        return await registerCompanyDirect(companyData, userData);
      }

      return { error: { message: error.message || "Erro ao criar empresa" } };
    }
  };

  // Método alternativo direto (fallback para quando RPC falha)
  const registerCompanyDirect = async (
    companyData: CompanyRegisterData,
    userData: UserRegisterData
  ) => {
    try {
      console.log("Usando método direto para registro...");

      // 1. Verificar se CNPJ já existe usando RPC (bypass RLS)
      const { error: cnpjError } = await supabase.rpc("check_existing_cnpj", {
        p_cnpj: companyData.cnpj,
      });

      if (cnpjError) {
        console.error("Erro ao verificar CNPJ:", cnpjError);
      }

      // Verificação simplificada - assumindo que se não há erro, o CNPJ existe
      if (!cnpjError) {
        return { error: { message: "CNPJ já cadastrado" } };
      }

      // 2. Verificar se email da empresa já existe
      const { error: companyEmailError } = await supabase.rpc(
        "check_existing_company_email",
        {
          p_email: companyData.email,
        }
      );

      if (companyEmailError) {
        console.error("Erro ao verificar email da empresa:", companyEmailError);
      }

      if (!companyEmailError) {
        return { error: { message: "Email da empresa já cadastrado" } };
      }

      // 3. Verificar se email do usuário já existe
      const { error: userError } = await supabase.rpc(
        "check_existing_user_email",
        { p_email: userData.email }
      );

      if (userError) {
        console.error("Erro ao verificar email do usuário:", userError);
      }

      if (!userError) {
        return { error: { message: "Email do usuário já cadastrado" } };
      }

      // 4. Inserir empresa
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert([
          {
            trade_name: companyData.trade_name,
            email: companyData.email,
            phone: companyData.phone,
            cnpj: companyData.cnpj,
            address: companyData.address,
            neighborhood: companyData.neighborhood,
            zip_code: companyData.zip_code,
            city: companyData.city,
            state: companyData.state,
          },
        ])
        .select()
        .single();

      if (companyError) {
        console.error("Erro ao inserir empresa:", companyError);

        if (companyError.code === "23505") {
          // Unique violation
          if (companyError.message.includes("cnpj")) {
            return { error: { message: "CNPJ já cadastrado" } };
          }
          if (companyError.message.includes("email")) {
            return { error: { message: "Email da empresa já cadastrado" } };
          }
        }

        // Se falhar por RLS, tentar uma última abordagem
        if (companyError.code === "42501") {
          return {
            error: { message: "Erro de permissão. Contate o administrador." },
          };
        }

        throw companyError;
      }

      // 5. Inserir usuário admin
      const { error: userError2 } = await supabase.from("users").insert([
        {
          name: userData.name,
          email: userData.email,
          password_hash: userData.password,
          role: "admin",
          company_id: company.id,
          is_active: true,
        },
      ]);

      if (userError2) {
        console.error("Erro ao inserir usuário:", userError2);

        if (userError2.code === "23505") {
          // Unique violation
          return { error: { message: "Email do usuário já cadastrado" } };
        }

        // Se falhar, fazer rollback da empresa
        await supabase.from("companies").delete().eq("id", company.id);

        throw userError2;
      }

      return { error: null };
    } catch (error: any) {
      console.error("Erro no registro direto:", error);
      return { error: { message: error.message || "Erro ao criar empresa" } };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      if (!isConnected) {
        return { error: { message: "Sem conexão com o banco de dados" } };
      }

      const { data: token, error } = await supabase.rpc(
        "request_password_reset",
        {
          user_email: email,
        }
      );

      if (error) {
        console.error("Erro ao solicitar reset de senha:", error);
        return { error: { message: "Erro ao solicitar recuperação de senha" } };
      }

      if (!token) {
        return { error: { message: "Email não encontrado" } };
      }

      return { error: null, token };
    } catch (error: any) {
      console.error("Erro no requestPasswordReset:", error);
      return {
        error: {
          message: error.message || "Erro ao solicitar recuperação de senha",
        },
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      if (!isConnected) {
        return { error: { message: "Sem conexão com o banco de dados" } };
      }

      // Primeiro validar o token
      const { data: validationData, error: validationError } =
        await supabase.rpc("validate_reset_token", {
          p_token: token,
        });

      if (
        validationError ||
        !validationData ||
        validationData.length === 0 ||
        !validationData[0].is_valid
      ) {
        return { error: { message: "Token inválido ou expirado" } };
      }

      const validation = validationData[0];

      // Atualizar a senha
      const { error } = await supabase.rpc("reset_password", {
        user_email: validation.user_email,
        new_password: newPassword,
      });

      if (error) {
        return { error: { message: "Erro ao redefinir senha" } };
      }

      return { error: null };
    } catch (error: any) {
      console.error("Erro no resetPassword:", error);
      return { error: { message: error.message || "Erro ao redefinir senha" } };
    }
  };

  const validateResetToken = async (token: string) => {
    try {
      if (!isConnected) {
        return { error: { message: "Sem conexão com o banco de dados" } };
      }

      const { data, error } = await supabase.rpc("validate_reset_token", {
        p_token: token,
      });

      if (error) {
        return { error: { message: "Erro ao validar token" } };
      }

      if (data && data.length > 0 && data[0].is_valid) {
        return {
          error: null,
          isValid: true,
          email: data[0].user_email,
        };
      } else {
        return {
          error: null,
          isValid: false,
        };
      }
    } catch (error: any) {
      console.error("Erro no validateResetToken:", error);
      return { error: { message: error.message || "Erro ao validar token" } };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // ATUALIZADO: Incluir loginWithGoogle no value
  const value = {
    user,
    isAuthenticated: !!user,
    isConnected,
    login,
    logout,
    register,
    registerCompany,
    requestPasswordReset,
    resetPassword,
    validateResetToken,
    loginWithGoogle, // ← ADICIONADO
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
