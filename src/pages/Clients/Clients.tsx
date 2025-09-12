// src/pages/Clients/Clients.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, AlertCircle, Edit, Trash2 } from "lucide-react";
import StatCard from "../../components/StatCard";
import ClientForm from "../../components/ClientForm";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  created_at: string;
}

const Clients: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withPending: 0,
  });

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, [user?.company_id]);

  const fetchClients = async () => {
    if (!user?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user?.company_id) return;

    try {
      // Total de clientes
      const { count: total, error: totalError } = await supabase
        .from("clients")
        .select("*", { count: "exact" })
        .eq("company_id", user.company_id);

      if (totalError) throw totalError;

      // Clientes ativos
      const { count: active, error: activeError } = await supabase
        .from("clients")
        .select("*", { count: "exact" })
        .eq("company_id", user.company_id)
        .eq("status", "active");

      if (activeError) throw activeError;

      setStats({
        total: total || 0,
        active: active || 0,
        withPending: Math.floor((total || 0) * 0.3), // Mock data
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleClientAdded = () => {
    fetchClients();
    fetchStats();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const { error } = await supabase
        .from("clients")
        .update({ status: "inactive" })
        .eq("id", clientId)
        .eq("company_id", user?.company_id);

      if (error) throw error;

      fetchClients();
      fetchStats();
      alert("Cliente excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Erro ao excluir cliente");
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Clientes</h1>
        <p>Gerencie sua base de clientes</p>
      </header>

      <div className="grid-cols-3">
        <StatCard
          title="Total de Clientes"
          value={stats.total}
          icon={<Users size={24} />}
        />
        <StatCard
          title="Clientes Ativos"
          value={stats.active}
          icon={<Users size={24} />}
        />
        <StatCard
          title="Clientes com Pendências"
          value={stats.withPending}
          icon={<AlertCircle size={24} />}
        />
      </div>

      <section className="page-section">
        <div className="section-header">
          <h2>Últimos Clientes Cadastrados</h2>
          <button onClick={() => setIsFormOpen(true)} className="btn-primary">
            <Plus size={18} />
            Novo Cliente
          </button>
        </div>

        <div className="data-table">
          <div className="table-header">
            <span>Nome</span>
            <span>Email</span>
            <span>Telefone</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : clients.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>Nenhum cliente cadastrado</h3>
              <p>Comece adicionando seu primeiro cliente</p>
            </div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="table-row">
                <span>{client.name}</span>
                <span>{client.email || "-"}</span>
                <span>{client.phone || "-"}</span>
                <span className={`status-badge ${client.status}`}>
                  {client.status === "active" ? "Ativo" : "Inativo"}
                </span>
                <span className="actions">
                  <button
                    onClick={() => handleEdit(client)}
                    className="icon-btn"
                    title="Editar cliente"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="icon-btn danger"
                    title="Excluir cliente"
                  >
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
            ))
          )}
        </div>

        {clients.length > 0 && (
          <div className="view-all">
            <Link to="/clientes-completos" className="btn-secondary">
              Ver todos os clientes
            </Link>
          </div>
        )}
      </section>

      <ClientForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onClientAdded={handleClientAdded}
        editingClient={editingClient}
      />
    </div>
  );
};

export default Clients;
