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
  EyeOff,
} from "lucide-react";
import "../styles/SuperDashboard.css";
import "../styles/Chats.css";


const getRoleIcon = (role) => {
  switch (role) {
    case "admin":
      return <Crown className="role-icon" />;
    case "analista":
      return <UserCheck className="role-icon" />;
    case "lector":
      return <Shield className="role-icon" />;
    default:
      return <Users className="role-icon" />;
  }
};

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
    role: "lector" 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({
    admin: 0,
    analista: 0,
    lector: 0,
    total: 0,
  });

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
        (stats.admin || 0) + (stats.analista || 0) + (stats.lector || 0);
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

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "admin" });
  };

  const getUserId = (u) => u?.id || u?._id || u?._userId || "";

  const handleEditUser = (user) => {
    const normalized = { ...user, id: getUserId(user) };
    console.debug("Opening edit modal for user:", normalized);
    setEditingUser(normalized);

    const resolvedRole =
      user.role || (Array.isArray(user.roles) && user.roles[0]) || "lector";

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: resolvedRole,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.debug("Submitting user form. editingUser:", editingUser, "form:", form);

    try {
      const payloadBase = { name: form.name, email: form.email };
      if (form.password) payloadBase.password = form.password;
      payloadBase.role = form.role;
      payloadBase.roles = [form.role];

      if (editingUser) {
        const userId = getUserId(editingUser);
        if (!userId) {
          toast.error("ID de usuario inválido. No se puede actualizar.");
          setLoading(false);
          return;
        }
        try {
          const endpoint = `/users/${userId}`;
          console.debug("PATCH ->", endpoint, payloadBase);
          const res = await api.patch(endpoint, payloadBase);
          console.debug("Respuesta update user:", res?.data);
          toast.success("Usuario actualizado");
        } catch (err) {
          console.error("Error updating user (PATCH):", err);
          console.error("Server response:", err.response?.data);
          const msg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Error al actualizar usuario";
          toast.error(msg);
          throw err;
        }
      } else {
        // creación existente
        const res = await api.post("/auth/register", {
          ...payloadBase,
          role: form.role,
          roles: [form.role],
        });
        console.debug("Respuesta create user:", res?.data);
        toast.success("Usuario creado");
      }

      setModalOpen(false);
      setEditingUser(null);
      resetForm();
      await loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      console.error("Server response:", error.response?.data);
      const serverMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error al guardar usuario";
      // si el error incluyó endpoints probados, añadirlos al log
      if (error.tried) console.error("Tried endpoints:", error.tried);
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Función para eliminar usuario
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

  const handleRoleChange = async (id, newRole) => {
    // Función para cambiar rol de usuario
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

  // Chats modal states & helpers
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  
  // selección y expansión de chats
  const [selectedChats, setSelectedChats] = useState(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [expandedChatIds, setExpandedChatIds] = useState(new Set());

  const toggleSelectChat = (chatId) => {
    setSelectedChats((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      setAllSelected(false);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!allSelected) {
      const ids = new Set((chatList || []).map((c) => c.id || c._id));
      setSelectedChats(ids);
      setAllSelected(true);
    } else {
      setSelectedChats(new Set());
      setAllSelected(false);
    }
  };

  const toggleExpandChat = (chatId) => {
    setExpandedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  const openChatsForUser = async (user) => {
    const userId = getUserId(user);
    if (!userId) {
      toast.error("User id inválido");
      return;
    }
    setSelectedChatUser(user);
    setSelectedChats(new Set());
    setAllSelected(false);
    setExpandedChatIds(new Set());
    setChatModalOpen(true);
    await loadUserChats(userId);
  };

  const loadUserChats = async (userId) => {
    setChatLoading(true);
    try {
      const res = await api.get(`/chats/${userId}`);
      // backend puede devolver { message, chats: [...] } o un array directo
      const chats = Array.isArray(res.data) ? res.data : res.data?.chats || [];
      setChatList(chats);
    } catch (err) {
      console.error("Error loading user chats:", err);
      toast.error("No se pudieron cargar los chats del usuario");
      setChatList([]);
    } finally {
      setChatLoading(false);
    }
  };

  // eliminar un chat (soft): DELETE /chats/soft/{chatId}
  const handleDeleteChat = async (chatId) => {
    if (!chatId) return;
    if (!window.confirm("¿Eliminar este chat?")) return;
    try {
      await api.delete(`/chats/soft/${chatId}`);
      toast.success("Chat eliminado");
      if (selectedChatUser) await loadUserChats(getUserId(selectedChatUser));
    } catch (err) {
      console.error("Error deleting chat:", err);
      toast.error("Error al eliminar chat");
    }
  };

  // eliminar chats seleccionados (soft) iterando DELETE /chats/soft/{id}
  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedChats);
    if (ids.length === 0) {
      toast.info("No hay chats seleccionados");
      return;
    }
    if (!window.confirm(`Eliminar ${ids.length} chat(s) seleccionados?`)) return;
    try {
      for (const id of ids) {
        await api.delete(`/chats/soft/${id}`);
      }
      toast.success("Chats seleccionados eliminados");
      setSelectedChats(new Set());
      setAllSelected(false);
      if (selectedChatUser) await loadUserChats(getUserId(selectedChatUser));
    } catch (err) {
      console.error("Error deleting selected chats:", err);
      toast.error("Error al eliminar algunos chats");
    }
  };

  const filteredUsers = (users || []).filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    resetForm();
  };

  let usersTableRows;
  if (filteredUsers && filteredUsers.length > 0) {
    usersTableRows = filteredUsers.map((userItem, idx) => {
      const uid = getUserId(userItem) || `row-${idx}`;
      return (
        <tr key={uid}>
          <td className="user-cell">
            <div className="user-info">
              {/* Mostrar name si existe; si no, indicar vacío y mostrar id pequeñ o "(sin nombre)" */}
              <span className="user-name">
                {userItem.name || <em className="no-name">(sin nombre)</em>}
              </span>
              {!userItem.name && (
                <small className="user-id">ID: {uid}</small>
              )}
            </div>
          </td>
          <td>
            {/* Click en email abre chats del usuario */}
            <button
              type="button"
              className="email-link"
              onClick={() => openChatsForUser(userItem)}
              title="Ver chats del usuario"
            >
              {userItem.email || <em>(sin email)</em>}
            </button>
          </td>
          <td>
            <div className="role-cell">
              {getRoleIcon(userItem.role)}
              <select
                value={userItem.role}
                onChange={(e) =>
                  handleRoleChange(getUserId(userItem), e.target.value)
                }
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
                type="button"
              >
                <Edit />
              </button>

              {/* Nuevo botón 'Chats' estilo primario, delante de Eliminar */}
              <button
                className="btn-chats"
                onClick={() => openChatsForUser(userItem)}
                disabled={loading}
                title="Chats del usuario"
                type="button"
                aria-label={`Ver chats de ${userItem.email || userItem.name || getUserId(userItem)}`}
              >
                <Eye className="btn-icon" />
                Chats
              </button>

              <button
                className="btn-action delete"
                onClick={() => handleDelete(getUserId(userItem))}
                disabled={loading}
                title="Eliminar usuario"
                type="button"
              >
                <Trash2 />
              </button>
            </div>
          </td>
        </tr>
      );
    });
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
          {/* Botón global para ver chats (abre selector por usuario) */}
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
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
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
                  //pesto edita el rol de usuario existente
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                  className="form-select"
                >
                  <option value="lector">Lector</option>
                  <option value="analista">Analista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
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

      {/* Chats Modal */}
      {chatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container chats-modal">
            <div className="modal-header chats-header">
              <div>
                <h2 className="chats-title">
                  Chats {selectedChatUser ? `de ${selectedChatUser.name || selectedChatUser.email || getUserId(selectedChatUser)}` : ""}
                </h2>
                <div className="chats-sub">Usuario ID: {selectedChatUser ? getUserId(selectedChatUser) : "-"}</div>
              </div>
              <div className="chats-actions">
                <button
                  onClick={() => {
                    setChatModalOpen(false);
                    setChatList([]);
                    setSelectedChatUser(null);
                    setSelectedChats(new Set());
                    setAllSelected(false);
                  }}
                  className="modal-close icon-btn"
                  type="button"
                >
                  <X />
                </button>
              </div>
            </div>

            <div className="modal-body chats-body">
              <div className="chats-controls" style={{display: "flex", gap: 8, marginBottom: 12, alignItems: "center"}}>
                <label style={{display:"inline-flex", alignItems:"center", gap:8}}>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  Seleccionar todo
                </label>
                <button className="btn-small" onClick={handleDeleteSelected} type="button">Eliminar seleccionados</button>
                <div style={{color:"#64748b", fontSize:13}}>{chatLoading ? "Cargando..." : `${chatList.length} chat(s)`}</div>
              </div>

              {chatLoading ? (
                <div className="center">Cargando chats...</div>
              ) : chatList.length === 0 ? (
                <div className="empty">No hay chats para este usuario.</div>
              ) : (
                <div className="chats-list">
                  {chatList.map((c) => {
                    const cid = c.id || c._id || c.createdAt;
                    const expanded = expandedChatIds.has(cid);
                    const checked = selectedChats.has(cid);
                    return (
                      <div key={cid} className="chat-card">
                        <div className="chat-card-top">
                          <div style={{display:"flex", alignItems:"center", gap:12}}>
                            <input type="checkbox" checked={checked} onChange={() => toggleSelectChat(cid)} />
                            <div className="chat-meta">
                              <div className="chat-id">{c.id || c._id || "(sin id)"}</div>
                              <div className="chat-date">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</div>
                            </div>
                          </div>

                          <div className="chat-controls">
                            <button className="btn-small" onClick={() => toggleExpandChat(cid)} type="button">
                              {expanded ? "Ocultar" : "Ver"}
                            </button>
                            <button className="btn-small danger" onClick={() => handleDeleteChat(cid)} type="button">Eliminar</button>
                          </div>
                        </div>

                        <div className={`chat-card-body ${expanded ? "expanded" : ""}`}>
                          <div className="chat-messages">
                            {(c.messages || []).length === 0 && (<div className="empty">Sin mensajes</div>)}
                            {(c.messages || []).map((m, i) => (
                              <div key={i} className={`message-bubble ${i % 2 === 0 ? "user" : "ai"}`}>
                                <div className="message-meta">
                                  <span className="author">{i % 2 === 0 ? "Usuario" : "IA"}</span>
                                  <span className="time">{m.timestamp ? new Date(m.timestamp).toLocaleString() : ""}</span>
                                </div>
                                <div className="message-content">
                                  <div className="q"><strong>Q:</strong> {m.question}</div>
                                  <div className="a"><strong>A:</strong> {m.answer}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setChatModalOpen(false);
                  setChatList([]);
                  setSelectedChatUser(null);
                  setSelectedChats(new Set());
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperDashboard;

// Asegúrate que el token se está enviando correctamente
//
