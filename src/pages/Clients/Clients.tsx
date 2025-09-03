// src/pages/Clients/Clients.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, AlertCircle } from "lucide-react";
import StatCard from "../../components/StatCard";
import { supabase } from "../../lib/supabase";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  created_at: string;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeClients = clients.filter(
    (client) => client.status === "active"
  ).length;
  const clientsWithPending = Math.floor(clients.length * 0.3); // Mock data

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Clientes</h1>
        <p>Gerencie sua base de clientes</p>
      </header>

      <div className="grid-cols-3">
        <StatCard
          title="Total de Clientes"
          value={clients.length}
          icon={<Users size={24} />}
        />
        <StatCard
          title="Clientes Ativos"
          value={activeClients}
          icon={<Users size={24} />}
        />
        <StatCard
          title="Clientes com Pendências"
          value={clientsWithPending}
          icon={<AlertCircle size={24} />}
        />
      </div>

      <section className="page-section">
        <div className="section-header">
          <h2>Todos os Clientes</h2>
          <Link to="/novo-cliente" className="btn-primary">
            <Plus size={18} />
            Novo Cliente
          </Link>
        </div>

        <div className="data-table">
          <div className="table-header">
            <span>Nome</span>
            <span>Email</span>
            <span>Telefone</span>
            <span>Status</span>
          </div>
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="table-row">
                <span>{client.name}</span>
                <span>{client.email}</span>
                <span>{client.phone}</span>
                <span className={`status-badge ${client.status}`}>
                  {client.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Clients;
