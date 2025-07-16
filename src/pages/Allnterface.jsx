// AllInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import  "../api/axios";
import Sidebar from "./Sidebar";
import ConfigMenu from "./ConfigMenu";
import ChatWindow from "./ChatWindow";


import {
  Send,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

import "../styles/Allterface.css";

export default function AllInterface() {  // Función principal
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

  const abortControllerRef = useRef(null); // Referencia al AbortController
  // Generar ID único para mensajes



  // Función para actualizar historial de chat
  const updateChatHistory = useCallback((chatId, message) => {
    setChatHistories(prev => {
        const updatedHistories = {
            ...prev,
            [chatId]: [...(prev[chatId] || []), message],
        };
        localStorage.setItem("chatHistories", JSON.stringify(updatedHistories)); // Guardar historial
        return updatedHistories;
    });
}, []);

  // Función para hacer streaming HTTP con fetch
  const streamIAResponse = async (question) => { // Función para hacer streaming HTTP con fetch
    setError("");
    setLoading(true);
    setIsStreaming(true);
    setStreamingText("");

    // Cancelar request anterior si existe
    if (abortControllerRef.current) { // Verificar si existe un AbortController
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController(); // Crear nuevo AbortController

    try { // Enviar solicitud
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

      if (!response.ok) { //  Manejo de errores
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader(); // Leer cuerpo de la respuesta
      const decoder = new TextDecoder();// Decodificar la respuesta
      let accumulatedText = "";// Texto acumulado

      while (true) { // Leer respuesta en partes
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;   
      }
      const responseData = JSON.parse(accumulatedText);
      const answerText = responseData.data.answer;

      // Agregar respuesta completa al historial
      updateChatHistory(activeChat, { 
        role: "ia", 
        text: answerText,
        timestamp: Date.now()
      });

    } catch (error) { // Manejo de errores
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

  
  useEffect(() => { // Función para manejar el cambio de chat
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e) => { // Función para enviar mensaje
    e.preventDefault();
    if (!userInput.trim()) {
      setError("Por favor escribe algo antes de enviar.");
      return;
    }

    const messageText = userInput.trim();// Elimina espacios en blanco al inicio y al final
    setUserInput("");

    // Agregar mensaje del usuario al historial
    updateChatHistory(activeChat, {  // Agregar mensaje del usuario al historial
      role: "user", 
      text: messageText,
      timestamp: Date.now()
    });

    // Iniciar streaming de respuesta
    await streamIAResponse(messageText);
  };


  const handleNewChat = (initialQuestion = "") => { // Función para crear un nuevo chat
    const newId = Date.now();
    const newTitle = initialQuestion 
        ? `Chat: ${initialQuestion.slice(0, 20)}...` 
        : `Chat ${chats.length + 1}`;
    
    const newChat = { id: newId, title: newTitle };
    setChats(prev => {
        const updatedChats = [...prev, newChat];
        localStorage.setItem("chats", JSON.stringify(updatedChats)); // Guardar chats
        return updatedChats;
    });
    setChatHistories(prev => {
        const updatedHistories = { ...prev, [newId]: [] };
        localStorage.setItem("chatHistories", JSON.stringify(updatedHistories)); // Guardar historiales
        return updatedHistories;
    });
    setActiveChat(newId);
    setError("");
    setStreamingText("");
    setIsStreaming(false);
  };

  const handleEditChatTitle = (chatId, newTitle) => {
    setChats(prev => {
        const updatedChats = prev.map(chat => chat.id === chatId ? { ...chat, title: newTitle } : chat);
        localStorage.setItem("chats", JSON.stringify(updatedChats)); // Guardar chats
        return updatedChats;
    });
  };

  const handleSearchChats = (query) => {
    const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(query));
    setChats(filteredChats);
  };

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("chats")) || [{ id: 1, title: "Chat principal" }];
    const savedChatHistories = JSON.parse(localStorage.getItem("chatHistories")) || { 1: [] };
    setChats(savedChats);
    setChatHistories(savedChatHistories);
    setActiveChat(savedChats[savedChats.length - 1]?.id || 1); // Último chat activo
  }, []);

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
    localStorage.setItem("chatHistories", JSON.stringify(chatHistories));
  }, [chats, chatHistories]);

  return (
    <div className={`ai-main ${theme === "dark" ? "ai-dark-bg" : "ai-light-bg"}`}>
      <Sidebar
        onNewChat={(initialQuestion) => handleNewChat(initialQuestion)}
        onEditChatTitle={handleEditChatTitle}
        chats={chats}
        activeChat={activeChat}
        onSearch={handleSearchChats}
      />
    
      <div className="ai-content">  
        <button // Botón para cambiar el tema
          className="ai-mode-toggle" 
          onClick={toggleTheme} 
          title="Cambiar Tema"
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
        
        <button // Botón de configuración
          className="ai-config-button" 
          onClick={() => setShowMenu(!showMenu)} 
          title="Configuración"
          aria-label="Configuración"
        >
          <Settings />
        </button>

        {showMenu && ( // Menu de configuración
          <ConfigMenu // Componente de menu de configuración
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
          <div className="ai-input-wrapper">
            <textarea
              type="text"   
              className="ai-input"
              placeholder="Escribe tu mensaje aquí..."
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                // Auto-resize del textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              disabled={loading || isStreaming}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="ai-submit-button" 
              disabled={loading || isStreaming || userInput.trim() === ""}
            >
              <Send size={16} />
              {loading || isStreaming ? " " : " "}
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