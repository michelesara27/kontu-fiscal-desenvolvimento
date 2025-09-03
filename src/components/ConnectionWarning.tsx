// src/components/ConnectionWarning.tsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { WifiOff } from "lucide-react"; // Removido Wifi não utilizado

const ConnectionWarning: React.FC = () => {
  const { isConnected } = useAuth();

  if (isConnected) return null;

  return (
    <div className="connection-warning">
      <WifiOff size={20} />
      <span>
        Sem conexão com o banco de dados. Verifique as credenciais do Supabase.
      </span>
    </div>
  );
};

export default ConnectionWarning;
