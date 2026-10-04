// Historial de las últimas operaciones de SnailPay. Muestra solo los últimos 4 dígitos de la tarjeta; el dato completo queda en LocalStorage.
import type { SnailPayResponse, SnailPayStatus } from "../services/snailPayService";

const LABELS: Record<SnailPayStatus, string> = {
  approved: "Aprobada",
  rejected: "Rechazada",
  error: "Error del sistema",
};

export function PaymentsList({ payments }: { payments: SnailPayResponse[] }) {
  return (
    <section className="panel wide">
      <h2>Últimas transacciones</h2>
      {payments.length === 0 ? (
        <p className="hint">Todavía no hay transacciones.</p>
      ) : (
        <ul className="payments">
          {payments.map((p) => (
            <li key={p.id}>
              <span className={`badge badge-${p.status}`}>{LABELS[p.status]}</span>
              <strong>
                {(p.transaction_amount ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
              </strong>
              <span className="muted">
                {p.card_number ? `•••• ${p.card_number.slice(-4)}` : "sin tarjeta"} · {p.status_detail} ·{" "}
                {p.reference} · {new Date(p.date_created).toLocaleString("es-MX")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}