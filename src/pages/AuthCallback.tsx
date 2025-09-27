// src/pages/AuthCallback.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = () => {
      if (user) {
        // Verifica se precisa completar cadastro (lógica personalizada)
        const needsRegistration = !localStorage.getItem(
          "registration_complete"
        );

        if (needsRegistration) {
          navigate("/complete-registration");
        } else {
          navigate("/dashboard");
        }
      } else {
        // Se não conseguiu autenticar, volta para login
        navigate("/");
      }
    };

    handleCallback();
  }, [user, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <div className="loading-spinner"></div>
      <p>Processando login...</p>
    </div>
  );
};

export default AuthCallback;
