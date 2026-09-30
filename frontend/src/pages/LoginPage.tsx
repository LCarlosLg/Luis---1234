import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../components/FormField";
import { useAuth } from "../context/useAuth";
import { validateLogin } from "../utils/validators";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const found = validateLogin(email, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h1>Iniciar sesión</h1>
        <FormField id="email" label="Correo electrónico" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <FormField id="password" label="Contraseña" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <button type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        <p className="alt">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </form>
    </main>
  );
}
