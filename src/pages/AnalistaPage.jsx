import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Settings,
  Download,
  LogOut,
  MessageSquare,
  Users,
  BarChart3,
  User,
  Bot,
  ChevronDown,
  ChevronRight,
  Brain,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import requestService from "../services/requestService";
import "../styles/Analista.css";
import ChatbotStats from "./ChatbotStats";
import PropTypes from "prop-types";

// Componente para las tarjetas de estadísticas
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-content">
      <div className="stat-info">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
      {/* Se utiliza el componente Icon aquí */}
      {Icon && <Icon className="stat-icon" />}
    </div>
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
};

const AnalistaPage = () => {
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filteredChats, setFilteredChats] = useState([]);
  const [userList, setUserList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserChats, setSelectedUserChats] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showingUserDetail, setShowingUserDetail] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [simulationQuery, setSimulationQuery] = useState("");
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const { user, logout } = useAuth();
  const [exportFormat, setExportFormat] = useState("json");

  // toggle expansión de chat
  const toggleChatExpansion = (chatId) => {
    setExpandedChatId((prev) => (prev === chatId ? null : chatId));
  };

  // Obtener lista de usuarios
  const fetchUserList = async () => {
    try {
      const res = await requestService.makeRequest(
        `${import.meta.env.VITE_API_URL}/users`
      );
      if (!res || !res.ok) throw new Error("Error al obtener usuarios");
      const data = await res.json();
      setUserList(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("No se pudieron cargar usuarios");
    }
  };

  // Obtener todos los chats (dashboard / analista)
  // helper: obtiene map de usuarios (id -> user) con fallback silencioso
  const getUserMap = async () => {
    try {
      let res = await requestService.makeRequest(`${import.meta.env.VITE_API_URL}/users`);
      // requestService puede devolver Response o body ya parseado
      let body;
      if (res && typeof res.json === "function") {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        body = await res.json();
      } else {
        body = res;
      }
      const usersArray = Array.isArray(body) ? body : Array.isArray(body?.users) ? body.users : [];
      return Object.fromEntries(usersArray.map(u => [u.id || u._id, u]));
    } catch (err) {
      console.warn("No se pudo cargar /users:", err);
      return {};
    }
  };

  // Uso en fetchAllChats: enriquecer con nombre a partir de chat.user o userMap[userId]
  const fetchAllChats = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint =
        user?.role === "admin" || user?.role === "analista"
          ? "/neural/chats"
          : `/chats/${user?.id}`;

      const res = await requestService.makeRequest(
        `${import.meta.env.VITE_API_URL}${endpoint}`
      );

      if (!res) throw new Error("No se obtuvo respuesta del servidor");

      const data = typeof res.json === "function" ? await res.json() : res;
      const chatsArray = Array.isArray(data) ? data : data.chats || [];

      // Si los chats no traen user, intentamos obtener /users una vez
      const needResolveUsers = chatsArray.some((c) => !c.user && c.userId);
      const userMap = needResolveUsers ? await getUserMap() : {};

      const enrichedChats = chatsArray.map((chat) => {
        const userObj = chat.user || userMap[chat.userId] || null;
        return {
          ...chat,
          userName: userObj?.name || (chat.userId ? `ID: ${chat.userId}` : "Usuario desconocido"),
          userEmail: userObj?.email || "",
          messagesCount: chat.messages?.length || 0,
          lastMessage:
            (chat.messages?.[chat.messages?.length - 1]?.answer || "").substring(0, 100) +
            (chat.messages?.length ? "..." : ""),
          createdAt: chat.createdAt || new Date().toISOString(),
        };
      });

      setChats(enrichedChats);
      setFilteredChats(enrichedChats);
    } catch (err) {
      console.error("Error al obtener chats:", err);
      setChats([]);
      setFilteredChats([]);
      setError("No se pudieron cargar las conversaciones");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Obtener chats de un usuario por id (analista)
  const fetchUserChats = async (userId, userName = "") => {
    setLoading(true);
    try {
      const res = await requestService.makeRequest(
        `${import.meta.env.VITE_API_URL}/chats/${userId}`
      );
      if (!res || !res.ok) throw new Error("Error al obtener chats del usuario");

      const data = await res.json();
      const chatsArray = Array.isArray(data) ? data : data.chats || [];

      const enrichedChats = chatsArray.map((chat) => ({
        ...chat,
        userName: chat.user?.name || userName || "Usuario desconocido",
        userEmail: chat.user?.email || "",
        messagesCount: chat.messages?.length || 0,
        lastMessage:
          (chat.messages?.[chat.messages?.length - 1]?.answer || "").substring(
            0,
            100
          ) + (chat.messages?.length ? "..." : ""),
        createdAt: chat.createdAt || new Date().toISOString(),
      }));

      setSelectedUserChats(enrichedChats);
      setSelectedUserId(userId);
      setSelectedUserName(userName);
      setShowingUserDetail(true);
      setFilteredChats(enrichedChats);
    } catch (err) {
      console.error("Error al obtener chats del usuario:", err);
      setSelectedUserChats([]);
      setFilteredChats([]);
      setError("No se pudieron cargar los chats del usuario");
    } finally {
      setLoading(false);
    }
  };

  // Simulación IA
  const handleSimulation = async () => {
    if (!simulationQuery.trim()) return;
    setSimulationLoading(true);
    try {
      const payload = {
        question: simulationQuery,
        module: "Simulacion",
      };

      // Usamos requestService si lo prefieres; aquí usamos fetch directo con token
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/neural/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res) throw new Error("No se obtuvo respuesta del servidor");
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(bodyText || `HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      const answer = data?.data?.answer || data?.answer || "";
      const chatId = data?.data?.chatId || null;

      setSimulationResult({
        question: simulationQuery,
        answer,
        chatId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error en simulación:", err);
      setSimulationResult({
        question: simulationQuery,
        error: err?.message || "Error en la simulación",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSimulationLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "analista") fetchUserList();
    fetchAllChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAllChats, user?.role]);

  // Búsqueda
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    const chatsToFilter = showingUserDetail ? selectedUserChats : chats;
    const filtered = chatsToFilter.filter((chat) => {
      const msg = chat.messages?.[0];
      return (
        chat.userName?.toLowerCase().includes(query) ||
        chat.userEmail?.toLowerCase().includes(query) ||
        msg?.question?.toLowerCase().includes(query) ||
        msg?.answer?.toLowerCase().includes(query)
      );
    });
    setFilteredChats(filtered);
  };

  // Exportar chat / usuario
  const exportChat = (chatId) => {
    const chatsToSearch = showingUserDetail ? selectedUserChats : chats;
    const chat = chatsToSearch.find((c) => c.id === chatId);
    if (!chat) return;
    const blob = new Blob([JSON.stringify(chat, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat_${chatId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportUserChats = () => {
    if (selectedUserChats.length === 0) return;
    const blob = new Blob([JSON.stringify(selectedUserChats, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chats_${selectedUserName}_${selectedUserId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const backToGeneral = () => {
    setShowingUserDetail(false);
    setSelectedUserChats([]);
    setSelectedUserId("");
    setSelectedUserName("");
    setFilteredChats(chats);
    setSearch("");
  };

  const handleUserClick = (userId, userName) => {
    if (user?.role === "analista") fetchUserChats(userId, userName);
  };

  // Render sections
  const renderDashboard = () => (
    <div className="analista-dashboard">
      <div className="stats-grid">
        <StatCard
          label="Total de Chats"
          value={chats.length}
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          label="Usuarios Únicos"
          value={new Set(chats.map((c) => c.userId)).size}
          icon={Users}
          color="green"
        />
      </div>
      <ChatbotStats />
    </div>
  );

  const renderConversaciones = () => {
    const getFilteredChats = () => {
      if (showingUserDetail) return search ? filteredChats : selectedUserChats;
      return filteredChats;
    };

    const currentFilteredChats = getFilteredChats();

    return (
      <div className="analista-conversations">
        <div className="conversations-header">
          {showingUserDetail && (
            <div className="user-detail-header">
              <button onClick={backToGeneral} className="back-btn" type="button">
                ← Volver a todos los usuarios
              </button>
              <h3>Chats de {selectedUserName}</h3>
              <button className="export-btn" onClick={exportUserChats} type="button">
                <Download className="btn-icon" />
                Exportar todos los chats
              </button>
            </div>
          )}

          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por usuario, email o contenido..."
              value={search}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          {!showingUserDetail && user?.role === "analista" && (
            <select
              value={selectedUserId}
              onChange={(e) => {
                const userId = e.target.value;
                if (userId) {
                  const selected = userList.find((u) => u.id === userId);
                  fetchUserChats(userId, selected?.name);
                } else {
                  backToGeneral();
                }
              }}
              className="user-select"
            >
              <option value="">Todos los usuarios</option>
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Cargando conversaciones...</p>
          </div>
        ) : null}

        {/* Refactor ternary to variable */}
        {(() => {
          if (loading) {
            return (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p>Cargando conversaciones...</p>
              </div>
            );
          }
          if (currentFilteredChats.length === 0) {
            return (
              <div className="empty-state">
                <MessageSquare className="empty-icon" />
                <h3>No hay conversaciones</h3>
                <p>No se encontraron conversaciones con los criterios actuales.</p>
              </div>
            );
          }
          return (
            <div className="conversations-list">
              {currentFilteredChats.map((chat) => (
                <div key={chat.id} className="conversation-item">
                  <div className="conversation-header">
                    <div className="conversation-info">
                      <button
                        type="button"
                        className={`conversation-title ${
                          !showingUserDetail && user?.role === "analista"
                            ? "clickable"
                            : ""
                        }`}
                        onClick={() =>
                          !showingUserDetail && handleUserClick(chat.userId, chat.userName)
                        }
                      >
                        {chat.userName}
                      </button>
                      <p className="conversation-email">{chat.userEmail}</p>
                      <p className="conversation-date">
                        {new Date(chat.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="conversation-stats">
                      <span className="message-count">{chat.messagesCount} mensajes</span>
                      <button
                        className="export-btn"
                        onClick={() => exportChat(chat.id)}
                        type="button"
                      >
                        <Download className="btn-icon" />
                        Exportar
                      </button>
                      <button
                        className="expand-btn"
                        onClick={() => toggleChatExpansion(chat.id)}
                        type="button"
                        aria-expanded={expandedChatId === chat.id}
                      >
                        {expandedChatId === chat.id ? (
                          <ChevronDown className="btn-icon" />
                        ) : (
                          <ChevronRight className="btn-icon" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedChatId === chat.id && (
                    <div className="conversation-messages">
                      {chat.messages?.map((message) => (
                        <div key={`${chat.id}-${message.timestamp}`} className="message-thread">
                          <div className="message-item user-message">
                            <div className="message-header">
                              <User className="message-icon user" />
                              <span className="message-label">Usuario</span>
                              <span className="message-time">
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="message-content">{message.question}</div>
                          </div>

                          <div className="message-item ai-message">
                            <div className="message-header">
                              <Bot className="message-icon ai" />
                              <span className="message-label">IA</span>
                              <span className="message-time">
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="message-content">{message.answer}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSimulacion = () => (
    <div className="analista-knowledge">
      <div className="simulation-container">
        <h2 className="simulation-title">
          <Brain className="title-icon" />
          Simulador de IA
        </h2>

        <div className="simulation-input-section">
          <textarea
            value={simulationQuery}
            onChange={(e) => setSimulationQuery(e.target.value)}
            placeholder="Escribe tu pregunta para probar la IA..."
            className="simulation-textarea"
            rows={4}
          />
          <button
            onClick={handleSimulation}
            disabled={simulationLoading || !simulationQuery.trim()}
            className="simulate-btn"
            type="button"
          >
            {simulationLoading ? (
              <>
                <div className="btn-spinner" />
                Procesando...
              </>
            ) : (
              <>
                <Eye className="btn-icon" />
                Simular
              </>
            )}
          </button>
        </div>

        {simulationResult && (
          <div className="simulation-results">
            <div className="result-header">
              <h3>Resultado de la Simulación</h3>
              <span className="result-timestamp">
                {new Date(simulationResult.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="result-question">
              <strong>Pregunta:</strong>
              <p>{simulationResult.question}</p>
            </div>

            {simulationResult.error ? (
              <div className="error-message">
                <p>{simulationResult.error}</p>
              </div>
            ) : (
              <div className="result-answer">
                <strong>Respuesta:</strong>
                <div className="answer-content">
                  <p>{simulationResult.answer}</p>
                </div>
              </div>
            )}

            {simulationResult.chatId && (
              <div className="result-metadata">
                <div className="metadata-item">
                  <strong>ID del Chat:</strong> {simulationResult.chatId}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="simulation-info">
          <h4>Información sobre el Simulador</h4>
          <p>
            Esta herramienta te permite probar las respuestas de la IA sin afectar
            las estadísticas principales del sistema. Úsala para:
          </p>
          <ul>
            <li>Probar nuevas preguntas</li>
            <li>Validar respuestas del sistema</li>
            <li>Entrenar y evaluar el comportamiento de la IA</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderConfiguracion = () => (
    <div className="analista-config">
      <div className="config-container">
        <h2 className="config-title">
          <Settings className="title-icon" />
          Configuración del Sistema
        </h2>

        <div className="config-section">
          <h3>Información del Usuario</h3>
          <div className="config-options">
            <div className="config-option">
              <strong>Nombre:</strong> {user?.name}
            </div>
            <div className="config-option">
              <strong>Email:</strong> {user?.email}
            </div>
            <div className="config-option">
              <strong>Rol:</strong> {user?.role}
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>Configuraciones de Vista</h3>
          <div className="config-options">
            <label className="config-option">
              <input type="checkbox" defaultChecked />{" "}
            </label>
            <label className="config-option">
              <input type="checkbox" defaultChecked />{" "}
              Notificaciones de nuevos chats
            </label>
            <label className="config-option">
              <input type="checkbox" defaultChecked />{" "}
              Notificaciones de nuevos chats
            </label>
            <label className="config-option">
              <input type="checkbox" />{" "}
              Modo oscuro
            </label>
          </div>
        </div>

        <div className="config-section">
          <h3>Exportación de Datos</h3>
          <div className="config-options">
            <div className="filter-options">
              <label>
                <select
                  className="filter-select"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>Sesión</h3>
          <button className="export-btn secondary" onClick={logout} type="button">
            <LogOut className="btn-icon" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="analista-page">
      <header className="analista-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Panel de Analista</h1>
            <p className="header-subtitle">Sistema de Análisis de Conversaciones</p>
          </div>
          <div className="user-info">
            <User className="user-icon" />
            <span className="user-name">{user?.name}</span>
          </div>
        </div>
      </header>

      <nav className="analista-nav">
        <div className="nav-tabs">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "conversaciones", label: "Conversaciones", icon: MessageSquare },
            { id: "simulacion", label: "Simulador IA", icon: Brain },
            { id: "configuracion", label: "Configuración", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
                type="button"
              >
                <Icon className="tab-icon" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="analista-main">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "conversaciones" && renderConversaciones()}
        {activeTab === "simulacion" && renderSimulacion()}
        {activeTab === "configuracion" && renderConfiguracion()}
      </main>
    </div>
  );
};

export default AnalistaPage;