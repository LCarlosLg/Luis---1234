// Pantalla principal. Solo se llega aquí con sesión activa (lo garantiza ProtectedRoute en App.tsx). Reúne todo lo que pide el enunciado: nombre, saldo, recarga con SnailPay, las dos gráficas y el cierre de sesión.

import { useNavigate } from "react-router-dom";
import { BalanceCard } from "../components/BalanceCard";
import { BetsDonutChart } from "../components/BetsDonutChart";
import { RaceWinsBarChart } from "../components/RaceWinsBarChart";
import { TopUpForm } from "../components/TopUpForm";
import { useAuth } from "../context/useAuth";
import { useBalance } from "../hooks/useBalance";

export default function DashboardPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { balance, credit } = useBalance(session?.userId ?? "");

  // Cerramos sesión y mandamos al login. Con `replace` el botón "atrás", no devuelve al dashboard.

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard">
      <header>
        <h1>Bienvenido, {session?.name}</h1>
        <button type="button" onClick={handleLogout}>Cerrar sesión</button>
      </header>

      <div className="grid">
        <BalanceCard balance={balance} />
        <TopUpForm onApproved={credit} />
        <BetsDonutChart />
        <RaceWinsBarChart />
      </div>
    </main>
  );
}