import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../components/FormField";
import { useAuth } from "../context/useAuth";
import { AuthError } from "../services/authService";
import { validateRegister, type FormErrors, type RegisterForm } from "../utils/validators";

const EMPTY: RegisterForm = { name: "", email: "", password: "", confirmPassword: "" };

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>(EMPTY);
  const [errors, setErrors] = useState<FormErrors<RegisterForm>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const found = validateRegister(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.code === "EMAIL_TAKEN") {
        setErrors({ email: err.message });
      } else {
        setSubmitError(err instanceof Error ? err.message : "No se pudo completar el registro.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h1>Crear cuenta</h1>
        <FormField id="name" label="Nombre completo" autoComplete="name"
          value={form.name} onChange={update("name")} error={errors.name} />
        <FormField id="email" label="Correo electrónico" type="email" autoComplete="email"
          value={form.email} onChange={update("email")} error={errors.email} />
        <FormField id="password" label="Contraseña" type="password" autoComplete="new-password"
          value={form.password} onChange={update("password")} error={errors.password} />
        <FormField id="confirmPassword" label="Confirmar contraseña" type="password"
          autoComplete="new-password" value={form.confirmPassword}
          onChange={update("confirmPassword")} error={errors.confirmPassword} />
        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <button type="submit" disabled={loading}>{loading ? "Creando cuenta..." : "Registrarme"}</button>
        <p className="alt">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </main>
  );
}
