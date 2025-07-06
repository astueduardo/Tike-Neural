// AllInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import ConfigMenu from "./ConfigMenu";
import ChatWindow from "./ChatWindow";

import {
  Send,
  Trash2,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

import "../styles/Allterface.css";

export default function AllInterface() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [chats, setChats] = useState([{ id: 1, title: "Chat principal" }]);
  const [activeChat, setActiveChat] = useState(1);
  const [chatHistories, setChatHistories] = useState({ 1: [] });
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);

  // Generar ID único para mensajes
  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Función para actualizar historial de chat
  const updateChatHistory = useCallback((chatId, message) => {
    setChatHistories(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), {
        ...message,
        id: message.id || generateMessageId(),
        timestamp: message.timestamp || Date.now()
      }],
    }));
  }, []);

  // Función para hacer streaming HTTP con fetch
  const streamIAResponse = async (question) => {
    setError("");
    setLoading(true);
    setIsStreaming(true);
    setStreamingText("");

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
          question: question,
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
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setStreamingText(accumulatedText);
      }

      // Agregar respuesta completa al historial
      updateChatHistory(activeChat, { 
        role: "ia", 
        text: accumulatedText,
        timestamp: Date.now()
      });

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error en streaming:', error);
        setError(error.message || "Error al obtener respuesta de la IA");
      }
    } finally {
      setStreamingText("");
      setIsStreaming(false);
      setLoading(false);
    }
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) {
      setError("Por favor escribe algo antes de enviar.");
      return;
    }

    const messageText = userInput.trim();
    setUserInput("");

    // Agregar mensaje del usuario al historial
    updateChatHistory(activeChat, { 
      role: "user", 
      text: messageText,
      timestamp: Date.now()
    });

    // Iniciar streaming de respuesta
    await streamIAResponse(messageText);
  };

  const handleClear = () => {
    setChatHistories(prev => ({
      ...prev,
      [activeChat]: []
    }));
    setError("");
    setStreamingText("");
    setIsStreaming(false);
  };

  const handleNewChat = () => {
    const newId = Date.now();
    const newTitle = `Chat ${chats.length + 1}`;
    setChats(prev => [...prev, { id: newId, title: newTitle }]);
    setChatHistories(prev => ({ ...prev, [newId]: [] }));
    setActiveChat(newId);
    setError("");
    setStreamingText("");
    setIsStreaming(false);
  };

  const handleSelectChat = (chatId) => {
    setActiveChat(chatId);
    setError("");
    setStreamingText("");
    setIsStreaming(false);
  };

  return (
    <div className={`ai-main ${theme === "dark" ? "ai-dark-bg" : "ai-light-bg"}`}>
      <Sidebar
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        chats={chats}
        activeChat={activeChat}
      />
      
      <div className="ai-content">
        <button 
          className="ai-mode-toggle" 
          onClick={toggleTheme} 
          title="Cambiar modo"
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
        
        <button 
          className="ai-config-button" 
          onClick={() => setShowMenu(!showMenu)} 
          title="Configuración"
          aria-label="Abrir configuración"
        >
          <Settings />
        </button>

        {showMenu && (
          <ConfigMenu
            onLogout={(action) => {
              if (action === "admin") navigate("/super-dashboard");
              else if (action === "analista") navigate("/analista");
              else {
                logout();
                navigate("/login");
              }
              setShowMenu(false);
            }}
          />
        )}

        <ChatWindow
          chatHistory={chatHistories[activeChat] || []}
          streamingText={streamingText}
          isStreaming={isStreaming}
          error={error}
        />

        <form className="ai-form" onSubmit={handleSubmit}>
          <textarea
            className="ai-input"
            placeholder="Pregunta lo que quieras"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            disabled={loading || isStreaming}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="ai-form-buttons">
            <button 
              type="submit" 
              className="ai-submit-button" 
              disabled={loading || isStreaming || userInput.trim() === ""}
            >
              <Send size={18} /> 
              {loading || isStreaming ? "Enviando..." : "Enviar"}
            </button>
            <button 
              type="button" 
              className="ai-clear-button" 
              onClick={handleClear} 
              disabled={loading || isStreaming}
            >
              <Trash2 size={18} /> Limpiar
            </button>
          </div>
        </form>
        
        {(loading || isStreaming) && (
          <div className="ai-typing-indicator">
            <span>Escribiendo respuesta</span>
            <div className="typing-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}