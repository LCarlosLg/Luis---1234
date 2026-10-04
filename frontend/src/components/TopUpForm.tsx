// Formulario para cargar saldo con SnailPay, que llama al backend y muestra el resultado. No hace ningún cargo real, solo simula la operación para poder testear el frontend y el backend sin depender de la api real de SnailPay.

import { useState, type ChangeEvent, type FormEvent } from "react";
import { chargeSnailPay, type SnailPayResponse } from "../services/snailPayService";
import { ApiError } from "../services/apiClient";
import { describeResult } from "../utils/snailPayMessages";
import { FormField } from "./FormField";

const QUICK_AMOUNTS = [100, 250, 500];

// La tarjeta ficticia que SnailPay aprueba, para no tener que escribirla.
const TEST_CARD = { cardHolder: "Titular de Prueba", cardNumber: "1234 1234 1234 1234", expiry: "12/26", cvv: "543" };

interface Props {
  userId: string;
  email: string;
  // Recibe la respuesta de SnailPay, sea cual sea el resultado.
  onResult: (result: SnailPayResponse) => void;
}

interface Form {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  amount: string;
}

type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = { cardHolder: "", cardNumber: "", expiry: "", cvv: "", amount: "" };

// Nombres de campo de SnailPay -> campos de este formulario.
const FIELD_MAP: Record<string, keyof Form> = {
  card_holder: "cardHolder",
  card_number: "cardNumber",
  expiration_date: "expiry",
  cvv: "cvv",
  transaction_amount: "amount",
};

// Deja solo dígitos y agrupa de 4 en 4 mientras se escribe.
const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

// Convierte "1226" en "12/26" mientras se escribe.
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

// Solo lo básico: que no haya campos vacíos y que el monto sea mayor que cero.
function validateBasics(f: Form): Errors {
  const errors: Errors = {};
  if (!f.cardHolder.trim()) errors.cardHolder = "Ingresa el nombre del titular.";
  if (!f.cardNumber.trim()) errors.cardNumber = "Ingresa el número de tarjeta.";
  if (!f.expiry.trim()) errors.expiry = "Ingresa el vencimiento.";
  if (!f.cvv.trim()) errors.cvv = "Ingresa el CVV.";
  if (!f.amount.trim()) errors.amount = "Ingresa el monto.";
  else if (!(Number(f.amount) > 0)) errors.amount = "El monto debe ser mayor que cero.";
  return errors;
}

export function TopUpForm({ userId, email, onResult }: Props) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [simulateDown, setSimulateDown] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Actualiza un campo, aplicando antes el formato que le toque.
  const update =
    (field: keyof Form, format: (v: string) => string = (v) => v) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: format(e.target.value) }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const found = validateBasics(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const result = await chargeSnailPay(
        {
          payer_id: userId,
          payer_email: email,
          card_holder: form.cardHolder.trim(),
          card_number: form.cardNumber.replace(/\s/g, ""),
          expiration_date: form.expiry,
          cvv: form.cvv,
          transaction_amount: Number(form.amount),
        },
        { simulateSystemError: simulateDown }
      );

      onResult(result);
      setMessage({ type: result.status === "approved" ? "ok" : "error", text: describeResult(result) });

      if (result.status === "approved") {
        setForm(EMPTY);
      } else if (result.errors) {
        // Datos inválidos: marcamos cada campo que SnailPay señaló.
        const fieldErrors: Errors = {};
        for (const err of result.errors) {
          const key = FIELD_MAP[err.field];
          if (key) fieldErrors[key] = err.message;
        }
        setErrors(fieldErrors);
      }
    } catch (err) {
      // Sin respuesta (sin conexión o timeout): no hay nada que guardar.
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
      <p className="hint">Pasarela simulada: usa solo datos de tarjeta ficticios.</p>
      <form className="topup" onSubmit={handleSubmit} noValidate>
        <button type="button" className="link" onClick={() => setForm((f) => ({ ...f, ...TEST_CARD }))}>
          Usar la tarjeta de prueba
        </button>
        <FormField id="cardHolder" label="Nombre completo del titular" autoComplete="off"
          value={form.cardHolder} onChange={update("cardHolder")} error={errors.cardHolder} />
        <FormField id="cardNumber" label="Número de tarjeta" inputMode="numeric" autoComplete="off"
          placeholder="0000 0000 0000 0000" value={form.cardNumber}
          onChange={update("cardNumber", formatCardNumber)} error={errors.cardNumber} />
        <div className="row">
          <FormField id="expiry" label="Vencimiento" inputMode="numeric" autoComplete="off"
            placeholder="MM/AA" value={form.expiry}
            onChange={update("expiry", formatExpiry)} error={errors.expiry} />
          <FormField id="cvv" label="CVV" inputMode="numeric" autoComplete="off" maxLength={3}
            value={form.cvv} onChange={update("cvv", (v) => v.replace(/\D/g, ""))} error={errors.cvv} />
        </div>
        <FormField id="amount" label="Monto a cargar" type="number" inputMode="decimal"
          placeholder="Ej. 100" value={form.amount} onChange={update("amount")} error={errors.amount} />
        {/* Atajos para no tener que teclear el monto. */}
        <div className="quick">
          {QUICK_AMOUNTS.map((q) => (
            <button key={q} type="button" className="secondary"
              onClick={() => setForm((f) => ({ ...f, amount: String(q) }))}>
              {q}
            </button>
          ))}
        </div>
        {/* Para probar el error del sistema (2.3.3) sin tocar el backend. */}
        <label className="checkbox">
          <input type="checkbox" checked={simulateDown} onChange={(e) => setSimulateDown(e.target.checked)} />
          Simular que SnailPay tiene un problema interno
        </label>
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