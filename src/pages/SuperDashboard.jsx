import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/SuperDashboard.css";

const user = JSON.parse(localStorage.getItem("user"));

function SuperDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState({ email: "", password: "", role: "admin" });

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/admin/users");
            setUsers(res.data);
        } catch {
            setError("Error al cargar usuarios");
        }
        setLoading(false);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("¿Seguro que dees eliminar este usuario?")) return;
        setLoading(true);
        setError("");
        try {
            // Elimina un usuario por ID
            await api.delete(`/users/${userId}`);
            setUsers(prev => prev.filter((u) => u.id !== userId));
            setSuccess("Usuario eliminado correctamente");
        } catch {
            setError("Error al eliminar usuario");
        }
        setLoading(false);
    };

    const handleChangeRole = async (userId) => {
        const newRole = window.prompt("Nuevo rol para este usuario (admin/analista):", "analista");
        if (!["admin", "analista"].includes(newRole)) {
            alert("Rol inválido");
            return;
        }
        setLoading(true);
        setError("");
        try {
            // Cambia el rol de un usuario
            await api.put(`/users/${userId}/role`, { role: newRole });
            setUsers(prev =>
                prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
            );
            setSuccess("Rol actualizado correctamente");
        } catch {
            setError("Error al cambiar rol");
        }
        setLoading(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            // Cambia aquí el endpoint:
            const res = await api.post("/auth/register", newUser);
            setUsers(prev => [...prev, res.data]);
            setShowCreate(false);
            setNewUser({ email: "", password: "", role: "analista" });
            setSuccess("Usuario creado correctamente");
        } catch {
            setError("Error al crear usuario");
        }
        setLoading(false);
    };

    return (
        <div className="ai-main" style={{ minHeight: "100vh", padding: "2rem" }}>
            <h2 className="ai-title text-black">Panel de Administración</h2>
            {error && <div style={{ color: "red" }}>{error}</div>}
            {success && <div style={{ color: "green" }}>{success}</div>}

            {/* Solo admin puede crear usuarios */}
            {user.role === "admin" && (
                <>
                    <button
                        className="ai-submit-button"
                        onClick={() => setShowCreate(true)}
                        disabled={loading}
                    >
                        Crear Usuario
                    </button>
                    {showCreate && (
                        <form onSubmit={handleCreateUser} style={{ margin: "1rem 0" }}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                required
                                style={{ marginRight: 8 }}
                            />
                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                required
                                style={{ marginRight: 8 }}
                            />
                            <select
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                required
                                style={{ marginRight: 8 }}
                            >
                                <option value="analista">Analista</option>
                                <option value="admin">Administrador</option>
                            </select>
                            <button type="submit" className="ai-submit-button" disabled={loading}>
                                Guardar
                            </button>
                            <button type="button" className="ai-clear-button" onClick={() => setShowCreate(false)}>
                                Cancelar
                            </button>
                        </form>
                    )}
                </>
            )}

            {loading ? (
                <div className="ai-loading">Cargando usuarios...</div>
            ) : (
                <table className="w-full mt-6 bg-white rounded shadow">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.email}</td>
                                <td>{u.role}</td>
                                <td>
                                    {user.role === "admin" ? (
                                        <>
                                            <button
                                                className="ai-clear-button"
                                                onClick={() => handleDeleteUser(u.id)}
                                                disabled={loading}
                                            >
                                                Eliminar
                                            </button>
                                            <button
                                                className="ai-submit-button"
                                                onClick={() => handleChangeRole(u.id)}
                                                disabled={loading}
                                                style={{ marginLeft: 8 }}
                                            >
                                                Cambiar Rol
                                            </button>
                                        </>
                                    ) : (
                                        <span>Sin permisos</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default SuperDashboard;
