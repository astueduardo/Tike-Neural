// SuperDashboard.jsx 
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck, 
  X,
  Search, 
  ChevronDown, 
  Crown, 
  Eye, 
  EyeOff
} from "lucide-react";
import "../styles/SuperDashboard.css";

const SuperDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "admin" //
  });
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({ admin: 0, analista: 0, lector: 0, total: 0 });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      toast.error("No tienes permisos para ver esta página");
      return;
    }
    
    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get("/users/stats");
      const stats = res.data.stats || {};
      const total =
        (stats.admin || 0) +
        (stats.analista || 0) +
        (stats.lector || 0);
      setStats({ ...stats, total });
    } catch {
      setStats({ admin: 0, analista: 0, lector: 0, total: 0 });
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      console.log("Respuesta del servidor:", res.data); 
    
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else {
        console.error("Formato de respuesta inesperado:", res.data);
        setUsers([]);
      }
    
      // Recarga las estadísticas después de cargar usuarios
      loadStats();
    } catch (error) {
      console.error("Error loading users:", error);
      console.error("Respuesta del servidor:", error.response?.data);
      toast.error(error.response?.data?.message || "Error al cargar usuarios");
      setUsers([]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        const data = { ...form };
        if (!form.password) delete data.password; // No actualizar contraseña si está vacía
        await api.put(`/users/${editingUser.id}`, data);// Actualiza el usuario existente
        toast.success("Usuario actualizado");// Muestra mensaje de éxito
      } else {
        await api.post("/auth/register", form); // Crea un nuevo usuario
        toast.success("Usuario creado");// Muestra mensaje de éxito
      }
      setModalOpen(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Error al guardar usuario");
    }
    setLoading(false);
  };

  const resetForm = () => {//
    setForm({ name: "", email: "", password: "", role: "" });//
  };

  const handleDelete = async (id) => {// Función para eliminar usuario
    if (!window.confirm("¿Eliminar usuario?")) return;
    setLoading(true);
    try {
      await api.delete(`/users/${id}`);
      toast.success("Usuario eliminado");
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error al eliminar usuario");
    }
    setLoading(false);
  };

  const handleRoleChange = async (id, newRole) => {// Función para cambiar rol de usuario
    if (!window.confirm(`¿Cambiar rol a ${newRole}?`)) return;
    setLoading(true);
    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      toast.success("Rol actualizado");
      loadUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    }
    setLoading(false);
  };

  const filteredUsers = (users || []).filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditUser = (user) => {//
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || ""
    });
    setModalOpen(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown className="role-icon admin" />;
      case "analista":
        return <UserCheck className="role-icon analista" />;
      case "lector":
        return <Shield className="role-icon lector" />;
      default:
        return <Shield className="role-icon" />;
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    resetForm();
  };

  let usersTableRows;
  if (filteredUsers && filteredUsers.length > 0) {
    usersTableRows = filteredUsers.map((userItem) => (
      <tr key={userItem.id}>
        <td className="user-cell">
          <div className="user-info">
            <span className="user-name">{userItem.name}</span>
          </div>
        </td>
        <td>{userItem.email}</td>
        <td>
          <div className="role-cell">
            {getRoleIcon(userItem.role)}
            <select
              value={userItem.role}
              onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
              className="role-select"
              disabled={loading}
            >
              <option value="lector">Lector</option>
              <option value="analista">Analista</option>
              <option value="admin">Administrador</option>
            </select>
            <ChevronDown className="select-icon" />
          </div>
        </td>
        <td>
          <div className="actions-cell">
            <button
              className="btn-action edit"
              onClick={() => handleEditUser(userItem)}
              disabled={loading}
              title="Editar usuario"
            >
              <Edit />
            </button>
            <button
              className="btn-action delete"
              onClick={() => handleDelete(userItem.id)}
              disabled={loading}
              title="Eliminar usuario"
            >
              <Trash2 />
            </button>
          </div>
        </td>
      </tr>
    ));
  } else {
    usersTableRows = (
      <tr>
        <td colSpan="4" className="empty-cell">
          {search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
        </td>
      </tr>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-title">
          <Users />
          <h1>Panel de Administración</h1>
        </div>
        <div className="header-actions">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              className="search-input"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {user?.role === "admin" && (
            <button
              className="btn-primary"
              onClick={() => {
                setModalOpen(true);
                setEditingUser(null);
                resetForm();
              }}
            >
              <Plus /> Nuevo Usuario
            </button>
          )}
        </div>
      </header>

      {/* Statistics Section */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <h3>Total Usuarios</h3>
            <p>{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Crown />
          </div>
          <div className="stat-content">
            <h3>Administradores</h3>
            <p>{stats.admin}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <UserCheck />
          </div>
          <div className="stat-content">
            <h3>Analistas</h3>
            <p>{stats.analista}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Shield />
          </div>
          <div className="stat-content">
            <h3>Lectores</h3>
            <p>{stats.lector}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="loading-cell">
                  Cargando usuarios...
                </td>
              </tr>
            ) : (
              usersTableRows
            )}
          </tbody>
        </table>
      </div>
      <p>Total encontrados: {filteredUsers.length}</p>
      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{editingUser ? "Editar Usuario" : "Crear Usuario"}</h2>
              <button 
                onClick={handleCloseModal} 
                className="modal-close"
                type="button"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Nombre</label>
                <input 
                  id="name"
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  id="email"
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  required 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">
                  Contraseña {editingUser && "(opcional)"}
                </label>
                <div className="password-input-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="form-input"
                    required={!editingUser}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="role">Rol</label>
                <select 
                  id="role"
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })} 
                  className="form-select"
                >
                  <option value="lector">Lector</option>
                  <option value="analista">Analista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {editingUser ? "Actualizar" : "Crear"}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperDashboard;

// Asegúrate que el token se está enviando correctamente
//;
