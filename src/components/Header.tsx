// src/components/Header.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Users,
  AlertCircle,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
// importa informações de Nome do sistema, Descrição, Ícone
import { AppConfig } from "../config/app";

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items - base para todos os usuários
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Pendências", href: "/pendencias", icon: AlertCircle },
    { name: "Lembretes", href: "/lembretes", icon: Bell },
  ];

  // Adicionar Configurações apenas para administradores
  const adminNavigation = [
    ...baseNavigation,
    { name: "Configurações", href: "/configuracoes", icon: Settings },
  ];

  // Definir navigation baseada no role do usuário
  const navigation = user?.role === "admin" ? adminNavigation : baseNavigation;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (location.pathname === "/login" || location.pathname === "/registro") {
    return null;
  }

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/dashboard" className="logo">
          <span>
            <Users size={24} /> {AppConfig.name}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="user-menu">
          <span className="user-email">{user?.email}</span>
          <span className="user-role">
            ({user?.role === "admin" ? "Administrador" : "Colaborador"})
          </span>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-btn"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="mobile-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`mobile-nav-link ${isActive ? "active" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="mobile-user-menu">
            <span>Logado como: {user?.email}</span>
            <span>
              Tipo: {user?.role === "admin" ? "Administrador" : "Colaborador"}
            </span>
            <button onClick={handleLogout} className="mobile-logout-btn">
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
