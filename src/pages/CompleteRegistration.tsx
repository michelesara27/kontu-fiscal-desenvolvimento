// src/pages/CompleteRegistration.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../database/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

interface EmpresaData {
  nome_fantasia: string;
  razao_social: string;
  email: string;
  telefone: string;
  cnpj: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const CompleteRegistration: React.FC = () => {
  const [formData, setFormData] = useState<EmpresaData>({
    nome_fantasia: "",
    razao_social: "",
    email: "",
    telefone: "",
    cnpj: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!user) throw new Error("Usuário não autenticado");

      // Salva os dados da empresa
      const { error: empresaError } = await supabase.from("empresas").insert([
        {
          ...formData,
          usuario_id: user.id,
          tipo: "gestor",
        },
      ]);

      if (empresaError) throw empresaError;

      // Marca o perfil como completo
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ empresa_completa: true })
        .eq("id", user.id);

      if (profileError) throw profileError;

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao completar cadastro:", error);
      setError("Erro ao salvar dados da empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="registration-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Complete seu Cadastro Empresarial</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label>Nome Fantasia *</label>
            <input
              type="text"
              name="nome_fantasia"
              value={formData.nome_fantasia}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Razão Social *</label>
            <input
              type="text"
              name="razao_social"
              value={formData.razao_social}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>CNPJ *</label>
            <input
              type="text"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              required
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="form-group">
            <label>E-mail *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Telefone *</label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="form-group">
            <label>CEP *</label>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              required
              placeholder="00000-000"
            />
          </div>

          <div className="form-group">
            <label>Endereço *</label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Número *</label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Complemento</label>
            <input
              type="text"
              name="complemento"
              value={formData.complemento}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Bairro *</label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Cidade *</label>
            <input
              type="text"
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Estado *</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              {/* ... todos os estados ... */}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Completar Cadastro"}
        </button>
      </form>
    </div>
  );
};

export default CompleteRegistration;
