// Valores padrão para desenvolvimento (substitua com seus valores)
//const DEFAULT_SUPABASE_URL = "https://niiuihggenwtxaupbqhm.supabase.co";
//const DEFAULT_SUPABASE_KEY =
//  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paXVpaGdnZW53dHhhdXBicWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjAwNTYsImV4cCI6MjA3MjQzNjA1Nn0.eH0V_vcO3SRFwT8n0kG_0akB5rddQVTcZPezYo5BUBY";

// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Valores padrão para desenvolvimento
const DEFAULT_SUPABASE_URL = "https://niiuihggenwtxaupbqhm.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paXVpaGdnZW53dHhhdXBicWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjAwNTYsImV4cCI6MjA3MjQzNjA1Nn0.eH0V_vcO3SRFwT8n0kG_0akB5rddQVTcZPezYo5BUBY";

// Tenta obter das variáveis de ambiente PRIMEIRO, usa fallback se não existir
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Verificação de variáveis de ambiente
if (
  !import.meta.env.VITE_SUPABASE_URL ||
  !import.meta.env.VITE_SUPABASE_ANON_KEY
) {
  console.warn("⚠️ Variáveis de ambiente do Supabase não encontradas.");
  console.warn("📝 Crie um arquivo .env com:");
  console.warn("VITE_SUPABASE_URL=sua_url_do_supabase");
  console.warn("VITE_SUPABASE_ANON_KEY=sua_chave_anonima");

  if (import.meta.env.DEV) {
    console.warn(
      "🚨 O app pode não funcionar corretamente sem as credenciais do Supabase"
    );
  } else {
    throw new Error("Missing Supabase environment variables");
  }
}

// Configuração do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

// Função de teste de conexão
export const testConnection = async () => {
  try {
    const { error } = await supabase.from("users").select("count").limit(1);
    if (error) {
      console.error("❌ Erro na conexão com Supabase:", error.message);
      return false;
    }
    console.log("✅ Conexão com Supabase estabelecida com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro na conexão com Supabase:", error);
    return false;
  }
};

// Funções personalizadas para suas tabelas
export const database = {
  // Users
  users: {
    async authenticate(email: string, password: string) {
      const { data, error } = await supabase.rpc("authenticate_user", {
        p_email: email,
        p_password: password,
      });

      return { data, error };
    },

    async create(userData: {
      name: string;
      email: string;
      password: string;
      role?: "admin" | "collaborator";
      company_id?: string;
    }) {
      const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();

      return { data, error };
    },

    async findByEmail(email: string) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      return { data, error };
    },

    async updatePassword(userId: string, newPassword: string) {
      const { error } = await supabase
        .from("users")
        .update({ password_hash: newPassword })
        .eq("id", userId);

      return { error };
    },

    async setResetToken(email: string, token: string, expiresAt: Date) {
      const { error } = await supabase
        .from("users")
        .update({
          reset_token: token,
          reset_token_expires: expiresAt.toISOString(),
        })
        .eq("email", email);

      return { error };
    },

    async validateResetToken(token: string) {
      const { data, error } = await supabase.rpc("validate_reset_token", {
        p_token: token,
      });

      return { data, error };
    },
  },

  // Companies
  companies: {
    async create(companyData: {
      trade_name: string;
      email: string;
      phone: string;
      cnpj: string;
      address: string;
      neighborhood: string;
      zip_code: string;
      city: string;
      state: string;
    }) {
      const { data, error } = await supabase
        .from("companies")
        .insert([companyData])
        .select()
        .single();

      return { data, error };
    },

    async findByCnpj(cnpj: string) {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("cnpj", cnpj)
        .single();

      return { data, error };
    },

    async findByEmail(email: string) {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("email", email)
        .single();

      return { data, error };
    },
  },

  // Invitations
  invitations: {
    async create(invitationData: {
      token: string;
      email: string;
      company_id: string;
      created_by: string;
      expires_at: string;
    }) {
      const { data, error } = await supabase
        .from("invitations")
        .insert([invitationData])
        .select()
        .single();

      return { data, error };
    },

    async validateToken(token: string) {
      const { data, error } = await supabase.rpc("validate_invitation", {
        p_token: token,
      });

      return { data, error };
    },

    async markAsUsed(token: string) {
      const { error } = await supabase
        .from("invitations")
        .update({ used: true })
        .eq("token", token);

      return { error };
    },
  },

  // Clients
  clients: {
    async findAllByCompany(companyId: string) {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      return { data, error };
    },

    async create(clientData: {
      name: string;
      email?: string;
      phone?: string;
      document_type?: string;
      document_number?: string;
      address?: string;
      status?: string;
      company_id: string;
      created_by: string;
    }) {
      const { data, error } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single();

      return { data, error };
    },
  },

  // Pendencies
  pendencies: {
    async findAllByCompany(companyId: string) {
      const { data, error } = await supabase
        .from("pendencies")
        .select("*, clients(name)")
        .eq("company_id", companyId)
        .order("due_date", { ascending: true });

      return { data, error };
    },

    async create(pendencyData: {
      title: string;
      description?: string;
      status?: string;
      due_date: string;
      priority?: string;
      client_id?: string;
      company_id: string;
      created_by: string;
    }) {
      const { data, error } = await supabase
        .from("pendencies")
        .insert([pendencyData])
        .select()
        .single();

      return { data, error };
    },
  },

  // Reminders
  reminders: {
    async findAllByCompany(companyId: string) {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("company_id", companyId)
        .order("due_date", { ascending: true });

      return { data, error };
    },

    async create(reminderData: {
      title: string;
      description?: string;
      due_date: string;
      status?: string;
      priority?: string;
      company_id: string;
      created_by: string;
    }) {
      const { data, error } = await supabase
        .from("reminders")
        .insert([reminderData])
        .select()
        .single();

      return { data, error };
    },
  },

  // Funções RPC personalizadas
  rpc: {
    async registerCompanyAndAdmin(
      companyData: {
        trade_name: string;
        email: string;
        phone: string;
        cnpj: string;
        address: string;
        neighborhood: string;
        zip_code: string;
        city: string;
        state: string;
      },
      userData: {
        name: string;
        email: string;
        password: string;
      }
    ) {
      const { data, error } = await supabase.rpc("register_company_and_admin", {
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

      return { data, error };
    },

    async registerUserWithInvite(
      userData: {
        name: string;
        email: string;
        password: string;
      },
      invitationToken: string
    ) {
      const { data, error } = await supabase.rpc("register_user_with_invite", {
        user_name: userData.name,
        user_email: userData.email,
        user_password: userData.password,
        invitation_token: invitationToken,
      });

      return { data, error };
    },

    async requestPasswordReset(email: string) {
      const { data, error } = await supabase.rpc("request_password_reset", {
        user_email: email,
      });

      return { data, error };
    },

    async resetPassword(email: string, newPassword: string) {
      const { data, error } = await supabase.rpc("reset_password", {
        user_email: email,
        new_password: newPassword,
      });

      return { data, error };
    },
  },
};

// Tipos para as funções do banco
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "collaborator";
  company_id?: string;
  is_active: boolean;
  reset_token?: string;
  reset_token_expires?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  trade_name: string;
  email: string;
  phone: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  zip_code: string;
  city: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  token: string;
  email: string;
  company_id: string;
  created_by: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document_type?: string;
  document_number?: string;
  address?: string;
  status: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Pendency {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date: string;
  priority: string;
  periodicity: string; // <-- CAMPO NOVO
  client_id?: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  clients?: {
    name: string;
  };
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  priority: string;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
