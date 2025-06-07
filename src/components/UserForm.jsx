import { useState } from "react";

function UserForm({ onSubmit, onCancel, loading }) {
    const [form, setForm] = useState({ email: "", password: "", role: "user" });
    const [error, setError] = useState("");

    // Validación simple
    const validate = () => {
        if (!form.email || !form.password) {
            setError("Email y contraseña son obligatorios");
            return false;
        }
        setError("");
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(form, setForm);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Crear usuario</h3>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={loading}
            />
            <input
                type="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                disabled={loading}
            />
            <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                disabled={loading}
            >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
                <option value="superuser">Superusuario</option>
            </select>
            <button
                className="ai-submit-button"
                type="submit"
                disabled={loading}
            >
                {loading ? "Creando..." : "Crear"}
            </button>
            <button
                className="ai-clear-button"
                type="button"
                onClick={onCancel}
                disabled={loading}
            >
                Cancelar
            </button>
        </form>
    );
}

export default UserForm;