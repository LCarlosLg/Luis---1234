// Pantalla principal del dashboard, que muestra el saldo, el formulario de recarga, los gráficos y el historial de operaciones. Maneja la sesión y el logout.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BalanceCard } from "../components/BalanceCard";
import { BetsDonutChart } from "../components/BetsDonutChart";
import { PaymentsList } from "../components/PaymentsList";
import { RaceWinsBarChart } from "../components/RaceWinsBarChart";
import { TopUpForm } from "../components/TopUpForm";
import { useAuth } from "../context/useAuth";
import { useBalance } from "../hooks/useBalance";
import { getPayments, savePayment } from "../services/paymentsService";
import type { SnailPayResponse } from "../services/snailPayService";

export default function DashboardPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const userId = session?.userId ?? "";
  const { balance, credit } = useBalance(userId);
  const [payments, setPayments] = useState(() => getPayments(userId));

  // Cada respuesta de SnailPay se guarda en el historial. El saldo sube solo si la operación fue aprobada; en cualquier otro caso no se toca.
  function handleResult(result: SnailPayResponse) {
    setPayments(savePayment(userId, result));
    if (result.status === "approved" && result.transaction_amount !== null) {
      credit(result.transaction_amount);
    }
  }

  // Cerramos sesión y mandamos al login. Con `replace` el botón "atrás" no devuelve al dashboard.
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
        <TopUpForm userId={userId} email={session?.email ?? ""} onResult={handleResult} />
        <BetsDonutChart />
        <RaceWinsBarChart />
        <PaymentsList payments={payments} />
      </div>
    </main>
  );
}