import React, { useEffect, useState, useRef } from "react";
import { MessageSquare, User, Search, Activity, Database, Settings, Users, Clock, Play, Download, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import requestService from "../services/requestService";
import "../styles/Analista.css";

const AnalistaPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [userList, setUserList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");
  const [simulationInput, setSimulationInput] = useState("");
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulatingIA, setSimulatingIA] = useState(false);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const abortControllerRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "admin") fetchUserList();
    fetchChats();
  }, [selectedUserId]);

  const fetchUserList = async () => {
    try {
      const res = await requestService.makeRequest(`${import.meta.env.VITE_API_URL}/users`);
      const data = await res.json();
      setUserList(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const fetchChats = async () => {
    setLoading(true);
    try {
      let endpoint;
      
      // Determinar endpoint según rol y usuario seleccionado
      if (user.role === "admin") {
        endpoint = selectedUserId ? `/chats/${selectedUserId}` : `/chats/all`;
      } else if (user.role === "analista") {
        endpoint = selectedUserId ? `/chats/${selectedUserId}` : `/chats/all`;
      } else {
        endpoint = `/chats/${user.id}`; // Lectores solo ven sus propios chats
      }

      const res = await requestService.makeRequest(`${import.meta.env.VITE_API_URL}${endpoint}`);
      const data = await res.json();
      
      let chatsArray = [];
      if (Array.isArray(data.chats)) {
        chatsArray = data.chats;
      } else if (Array.isArray(data)) {
        chatsArray = data;
      }

      // Enriquecer los chats con información del usuario
      const enrichedChats = chatsArray.map(chat => ({
        ...chat,
        userName: chat.user?.name || chat.userName || "Usuario desconocido",
        userEmail: chat.user?.email || chat.userEmail || "",
        messagesCount: chat.messages?.length || 0,
        lastMessage: chat.messages?.[chat.messages?.length - 1]?.answer?.substring(0, 100) + "..." || "",
        createdAt: chat.createdAt || new Date().toISOString()
      }));

      setChats(enrichedChats);
      setFilteredChats(enrichedChats);
    } catch (error) {
      console.error("Error al obtener chats:", error);
      setChats([]);
      setFilteredChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    const filtered = chats.filter((chat) => {
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

  const handleSimulate = async () => {
    if (!simulationInput.trim()) return;
    
    setSimulatingIA(true);
    setSimulationResult(null);

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/neural/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          question: simulationInput,
          module: "Conversacion"
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulatedText += decoder.decode(value, { stream: true });
      }

      const data = JSON.parse(accumulatedText);
      
      setSimulationResult({
        question: simulationInput,
        answer: data?.data?.answer || "Sin respuesta",
        intention: data?.data?.intention || "No detectada",
        entities: data?.data?.entities || [],
        timestamp: new Date().toLocaleString()
      });
      
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error en simulación IA:", error);
        setSimulationResult({
          question: simulationInput,
          answer: "Error al obtener respuesta",
          error: error.message,
          timestamp: new Date().toLocaleString()
        });
      }
    } finally {
      setSimulatingIA(false);
    }
  };

  const handleUserChange = (e) => {
    setSelectedUserId(e.target.value);
  };

  const exportToPDF = () => {
    window.print();
  };

  const exportChatData = () => {
    const dataToExport = filteredChats.map(chat => ({
      usuario: chat.userName,
      email: chat.userEmail,
      fecha: new Date(chat.createdAt).toLocaleDateString(),
      mensajes: chat.messagesCount,
      conversacion: chat.messages?.map(msg => ({
        pregunta: msg.question,
        respuesta: msg.answer,
        timestamp: msg.timestamp
      })) || []
    }));

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chats_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleChatExpansion = (chatId) => {
    setExpandedChatId(expandedChatId === chatId ? null : chatId);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "conversaciones", label: "Conversaciones", icon: MessageSquare },
    { id: "conocimiento", label: "Simulación IA", icon: Database },
    { id: "configuracion", label: "Configuración", icon: Settings }
  ];

  const dashboardStats = {
    totalChats: chats.length,
    totalMessages: chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
    avgMessagesPerChat: chats.length > 0
      ? (chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0) / chats.length).toFixed(1)
      : 0
  };

  const renderDashboard = () => (
    <div className="analista-page">
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total de Chats</p>
              <p className="stat-value">{dashboardStats.totalChats}</p>
            </div>
            <MessageSquare className="stat-icon" />
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total de Mensajes</p>
              <p className="stat-value">{dashboardStats.totalMessages}</p>
            </div>
            <Users className="stat-icon" />
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Promedio x Chat</p>
              <p className="stat-value">{dashboardStats.avgMessagesPerChat}</p>
            </div>
            <Clock className="stat-icon" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderConversaciones = () => (
    <div className="analista-conversations">
      <div className="conversations-header">
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
        
        {(user?.role === "admin" || user?.role === "analista") && (
          <select
            value={selectedUserId}
            onChange={handleUserChange}
            className="user-select"
          >
            <option value="">Todos los usuarios</option>
            {userList.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        )}
        
        <button onClick={exportToPDF} className="export-btn">
          <FileText className="btn-icon" />
          PDF
        </button>
        
        <button onClick={exportChatData} className="export-btn secondary">
          <Download className="btn-icon" />
          JSON
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando conversaciones...</p>
        </div>
      ) : (
        <div className="conversations-list">
          {filteredChats.length === 0 ? (
            <div className="empty-state">
              <MessageSquare className="empty-icon" />
              <h3>No hay conversaciones</h3>
              <p>No se encontraron conversaciones para mostrar</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div key={chat.id} className="conversation-item">
                <div className="conversation-header" onClick={() => toggleChatExpansion(chat.id)}>
                  <div className="conversation-info">
                    <h3 className="conversation-title">
                      {chat.userName}
                    </h3>
                    <p className="conversation-email">{chat.userEmail}</p>
                    <p className="conversation-date">
                      {new Date(chat.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="conversation-stats">
                    <span className="message-count">
                      {chat.messagesCount} mensajes
                    </span>
                    <button className="expand-btn">
                      {expandedChatId === chat.id ? '−' : '+'}
                    </button>
                  </div>
                </div>
                
                {expandedChatId === chat.id && (
                  <div className="conversation-messages">
                    {chat.messages?.map((msg, idx) => (
                      <div key={idx} className="message-thread">
                        {msg.question && (
                          <div className="message-item user-message">
                            <div className="message-header">
                              <User className="message-icon user" />
                              <span className="message-label">Pregunta:</span>
                              <span className="message-time">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                              </span>
                            </div>
                            <div className="message-content">
                              {msg.question}
                            </div>
                          </div>
                        )}
                        {msg.answer && (
                          <div className="message-item ai-message">
                            <div className="message-header">
                              <MessageSquare className="message-icon ai" />
                              <span className="message-label">Respuesta IA:</span>
                              <span className="message-time">
                                {msg.timestamp ? new Date(msg.timestamp + 1000).toLocaleTimeString() : ''}
                              </span>
                            </div>
                            <div className="message-content">
                              {msg.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      <div className="conversations-footer">
        <p>Total: {filteredChats.length} conversaciones encontradas</p>
        <p>Mensajes totales: {filteredChats.reduce((sum, chat) => sum + chat.messagesCount, 0)}</p>
      </div>
    </div>
  );

  const renderConocimiento = () => (
    <div className="analista-knowledge">
      <div className="simulation-container">
        <h2 className="simulation-title">
          <Play className="title-icon" /> 
          Simulador de IA - Prueba de Respuestas
        </h2>
        
        <div className="simulation-input-section">
          <textarea
            placeholder="Escribe una pregunta para probar la respuesta de la IA..."
            value={simulationInput}
            onChange={(e) => setSimulationInput(e.target.value)}
            className="simulation-textarea"
            rows={3}
          />
          <button
            onClick={handleSimulate}
            disabled={simulatingIA || !simulationInput.trim()}
            className="simulate-btn"
          >
            {simulatingIA ? (
              <>
                <div className="btn-spinner"></div>
                Consultando IA...
              </>
            ) : (
              <>
                <Play className="btn-icon" />
                Probar con IA
              </>
            )}
          </button>
        </div>

        {simulationResult && (
          <div className="simulation-results">
            <div className="result-header">
              <h3>Resultado de la Simulación</h3>
              <span className="result-timestamp">{simulationResult.timestamp}</span>
            </div>
            
            <div className="result-question">
              <strong>Pregunta:</strong>
              <p>{simulationResult.question}</p>
            </div>
            
            <div className="result-answer">
              <strong>Respuesta de la IA:</strong>
              <div className="answer-content">
                {simulationResult.error ? (
                  <div className="error-message">
                    <p>❌ Error: {simulationResult.error}</p>
                  </div>
                ) : (
                  <p>{simulationResult.answer}</p>
                )}
              </div>
            </div>
            
            {simulationResult.intention && (
              <div className="result-metadata">
                <div className="metadata-item">
                  <strong>Intención detectada:</strong> {simulationResult.intention}
                </div>
                {simulationResult.entities && simulationResult.entities.length > 0 && (
                  <div className="metadata-item">
                    <strong>Entidades:</strong> {simulationResult.entities.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="simulation-info">
          <h4>ℹ️ Información del Simulador</h4>
          <p>Este simulador te permite probar cómo responde la IA a diferentes preguntas sin afectar las conversaciones reales de los usuarios.</p>
          <ul>
            <li>Las respuestas son generadas en tiempo real por el mismo sistema de IA</li>
            <li>Ideal para probar nuevas funcionalidades o validar respuestas</li>
            <li>Los resultados no se guardan en el historial</li>
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
          <h3>Preferencias de Análisis</h3>
          <div className="config-options">
            <label className="config-option">
              <input type="checkbox" />
              Mostrar métricas avanzadas
            </label>
            <label className="config-option">
              <input type="checkbox" />
              Exportación automática
            </label>
            <label className="config-option">
              <input type="checkbox" />
              Notificaciones en tiempo real
            </label>
          </div>
        </div>
        
        <div className="config-section">
          <h3>Filtros de Datos</h3>
          <div className="filter-options">
            <label>
              Período de análisis:
              <select className="filter-select">
                <option>Último mes</option>
                <option>Últimos 3 meses</option>
                <option>Último año</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="analista-page">
      <header className="analista-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="header-title">Panel de Analista</h1>
            <p className="header-subtitle">Visualización de conversaciones y métricas</p>
          </div>
          <div className="user-info">
            <User className="user-icon" />
            <span className="user-name">{user?.name || "Analista"}</span>
          </div>
        </div>
      </header>

      <nav className="analista-nav">
        <div className="nav-tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`nav-tab ${activeTab === id ? "active" : ""}`}
            >
              <Icon className="tab-icon" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="analista-main">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "conversaciones" && renderConversaciones()}
        {activeTab === "conocimiento" && renderConocimiento()}
        {activeTab === "configuracion" && renderConfiguracion()}
      </main>
    </div>
  );
};

export default AnalistaPage;