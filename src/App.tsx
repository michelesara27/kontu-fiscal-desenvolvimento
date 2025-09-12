// src/App.tsx (atualizado)
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
//Components
import ConnectionWarning from "./components/ConnectionWarning";
import Header from "./components/Header";
//Pages
import Dashboard from "./pages/Dashboard/Dashboard";
import Clients from "./pages/Clients/Clients";
import Obligations from "./pages/Pendencies/Obligations";
import Reminders from "./pages/Reminders/Reminders";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
//CSS
import "./index.css";

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppContent() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pendencias"
            element={
              <ProtectedRoute>
                <Obligations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lembretes"
            element={
              <ProtectedRoute>
                <Reminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Componente principal da aplicação (COM AuthProvider aqui)
// Verifica conexão com Supabase
function App() {
  return (
    <AuthProvider>
      <Router>
        <ConnectionWarning />
        <AppContent /> {/* ✅ Agora está correto - não é recursão */}
      </Router>
    </AuthProvider>
  );
}

export default App;
