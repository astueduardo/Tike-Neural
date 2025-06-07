import { useEffect, useState } from "react";
import api from "../api/axios";
import UserForm from "../components/UserForm";

function SuperDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/admin/users");
                setUsers(res.data);
            } catch {
                setError("Error al cargar usuarios");
                setUsers([]);
            }
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const handleCreateUser = async (form, resetForm) => {
        setError("");
        setSuccess("");
        setCreating(true);
        try {
            const res = await api.post("/admin/users", form);
            setUsers(prev => [...prev, res.data]);
            setShowModal(false);
            resetForm({ email: "", password: "", role: "user" });
            setSuccess("Usuario creado correctamente");
        } catch {
            setError("Error al crear usuario");
        }
        setCreating(false);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
        setError("");
        setSuccess("");
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter((u) => u.id !== userId));
            setSuccess("Usuario eliminado correctamente");
        } catch {
            setError("Error al eliminar usuario");
        }
    };

    return (
        <div className="ai-main" style={{ minHeight: "100vh", padding: "2rem" }}>
            <h2 className="ai-title text-black">Panel de Superusuario</h2>
            {error && <div style={{ color: "red" }}>{error}</div>}
            {success && <div style={{ color: "green" }}>{success}</div>}
            <button
                className="ai-submit-button"
                onClick={() => setShowModal(true)}
                disabled={loading}
            >
                Crear usuario/administrador
            </button>
            {showModal && (
                <div className="modal-bg">
                    <div className="modal-content">
                        <UserForm
                            onSubmit={handleCreateUser}
                            onCancel={() => setShowModal(false)}
                            loading={creating}
                        />
                    </div>
                </div>
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
                                    <button
                                        className="ai-clear-button"
                                        onClick={() => handleDeleteUser(u.id)}
                                    >
                                        Eliminar
                                    </button>
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