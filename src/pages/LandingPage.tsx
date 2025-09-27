// src/pages/LandingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Bem-vindo ao
            <span className="gradient-text"> Dashboard Pro</span>
          </h1>
          <p className="hero-subtitle">
            A plataforma completa para gerenciar seus projetos, equipes e
            métricas com visualizações intuitivas e poderosas.
          </p>

          <div className="hero-buttons">
            <GoogleLoginButton />
            <Link to="/register" className="btn btn-secondary btn-large">
              📝 Criar Conta com E-mail
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-card"></div>
            <div className="preview-card"></div>
            <div className="preview-card"></div>
            <div className="preview-card"></div>
          </div>
        </div>
      </section>

      {/* ... resto do código da landing page ... */}
    </div>
  );
};

export default LandingPage;
