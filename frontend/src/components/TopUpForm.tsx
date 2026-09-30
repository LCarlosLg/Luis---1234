// Formulario para recargar saldo con SnailPay. Se usa en la pantalla de inicio y en la de resultados. El monto mínimo es 50 y el máximo 10,000. Se puede teclear o usar los botones de atajo.

import { useState, type FormEvent } from "react";
import { ApiError } from "../services/apiClient";
import { chargeSnailPay } from "../services/snailPayService";

const MIN = 50;
const MAX = 10000;
const QUICK_AMOUNTS = [100, 250, 500];

interface Props {
  // Se ejecuta únicamente cuando SnailPay aprueba el cobro.
  onApproved: (amount: number) => void;
}

export function TopUpForm({ onApproved }: Props) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const value = Number(amount);
    if (!Number.isInteger(value) || value < MIN || value > MAX) {
      setMessage({ type: "error", text: `Ingresa un monto entero entre ${MIN} y ${MAX}.` });
      return;
    }

    setLoading(true);
    try {
      const charge = await chargeSnailPay(value);
      onApproved(charge.amount); // solo llegamos aquí si el pago fue aprobado
      setAmount("");
      setMessage({ type: "ok", text: `Recarga aprobada. Referencia: ${charge.transactionId}` });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof ApiError ? err.message : "No se pudo completar la recarga.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Cargar saldo con SnailPay</h2>
      <form className="topup" onSubmit={handleSubmit} noValidate>
        <input
          type="number"
          inputMode="numeric"
          placeholder={`Monto (${MIN} - ${MAX})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Monto a cargar"
        />
        {/* Atajos para no tener que teclear el monto. */}
        <div className="quick">
          {QUICK_AMOUNTS.map((q) => (
            <button key={q} type="button" className="secondary" onClick={() => setAmount(String(q))}>
              {q}
            </button>
          ))}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Procesando con SnailPay..." : message?.type === "error" ? "Reintentar" : "Cargar saldo"}
        </button>
      </form>
      {message && (
        <p className={message.type === "ok" ? "form-ok" : "form-error"} role="alert">
          {message.text}
        </p>
      )}
    </section>
  );
}