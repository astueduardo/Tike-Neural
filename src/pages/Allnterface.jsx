// AllInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import "../api/axios";
import Sidebar from "./Sidebar";
import ConfigMenu from "./ConfigMenu";
import ChatWindow from "./ChatWindow";
import { Send, Settings, Sun, Moon } from "lucide-react";
import "../styles/Allterface.css";

export default function AllInterface() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatHistories, setChatHistories] = useState({});
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [originalChats, setOriginalChats] = useState([]);
  const abortControllerRef = useRef(null);

  const localKey = (key) => `${key}_${user?.id || "guest"}`;

  const loadChatsFromBackend = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      const savedChats = JSON.parse(localStorage.getItem(localKey("chats"))) || [];
      const savedHistories = JSON.parse(localStorage.getItem(localKey("chatHistories"))) || {};
      setChats(savedChats);
      setOriginalChats(savedChats);
      setChatHistories(savedHistories);
      if (savedChats.length > 0) {
        setActiveChat(savedChats[savedChats.length - 1].id);
      }
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/neural/chats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.chats || !Array.isArray(data.chats)) {
        console.warn('Respuesta del backend no tiene formato esperado:', data);
        throw new Error('Formato de respuesta inválido');
      }

      const transformedChats = data.chats.map(chat => ({
        id: chat._id,
        title: chat.question.slice(0, 20) + "..." || `Chat ${new Date(chat.createdAt).toLocaleDateString()}`,
        createdAt: chat.createdAt
      }));

      const histories = {};
      data.chats.forEach(chat => {
        if (!histories[chat._id]) {
          histories[chat._id] = [];
        }
        histories[chat._id].push(
          {
            role: "user",
            text: chat.question,
            timestamp: new Date(chat.createdAt).getTime()
          },
          {
            role: "ia",
            text: chat.answer,
            timestamp: new Date(chat.createdAt).getTime() + 1000
          }
        );
      });

      setChats(transformedChats);
      setOriginalChats(transformedChats);
      setChatHistories(histories);

      localStorage.setItem(localKey("chats"), JSON.stringify(transformedChats));
      localStorage.setItem(localKey("chatHistories"), JSON.stringify(histories));

      if (transformedChats.length > 0) {
        setActiveChat(transformedChats[transformedChats.length - 1].id);
      }

    } catch (error) {
      console.error('Error cargando chats desde backend:', error);
      const savedChats = JSON.parse(localStorage.getItem(localKey("chats"))) || [];
      const savedHistories = JSON.parse(localStorage.getItem(localKey("chatHistories"))) || {};
      setChats(savedChats);
      setOriginalChats(savedChats);
      setChatHistories(savedHistories);
      if (savedChats.length > 0) {
        setActiveChat(savedChats[savedChats.length - 1].id);
      }
    }
  }, [user]);

  const updateChatHistory = useCallback((chatId, message) => {
    setChatHistories(prev => {
      const updated = {
        ...prev,
        [chatId]: [...(prev[chatId] || []), message]
      };
      localStorage.setItem(localKey("chatHistories"), JSON.stringify(updated));
      return updated;
    });
  }, [user]);


  
  const streamIAResponse = async (question) => {
  const token = localStorage.getItem("token");
  if (!token) {
    setError("No se encontró token de autenticación. Por favor, inicia sesión nuevamente.");
    return;
  }

  setError("");
  setLoading(true);
  setIsStreaming(true);
  setStreamingText("");

  if (abortControllerRef.current) abortControllerRef.current.abort();
  abortControllerRef.current = new AbortController();

  try {
    let chatId = activeChat;
    if (!chatId) {
      chatId = Date.now().toString();
      const newChat = {
        id: chatId,
        title: question.slice(0, 20) + "...",
        createdAt: new Date().toISOString(),
      };
      const updatedChats = [...chats, newChat];
      setChats(updatedChats);
      setOriginalChats(updatedChats);
      setChatHistories(prev => ({ ...prev, [chatId]: [] }));
      setActiveChat(chatId);
      localStorage.setItem("chats", JSON.stringify(updatedChats));
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/neural/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        question,
        module: "Conversacion",
        chatId: chatId
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
      // Puedes actualizar streamingText si quieres mostrar texto en vivo
      setStreamingText(prev => prev + decoder.decode(value, { stream: true }));
    }

    const data = JSON.parse(accumulatedText);
    const answerText = data?.data?.answer;

    if (!answerText) throw new Error("Respuesta del servidor inválida");

    updateChatHistory(chatId, {
      role: "ia",
      text: answerText,
      timestamp: Date.now(),
    });

  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Error en streaming:", error);
      setError(error.message || "Error al obtener respuesta de la IA");
    }
  } finally {
    setStreamingText("");
    setIsStreaming(false);
    setLoading(false);
  }
};




  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) {
      setError("Por favor escribe algo antes de enviar.");
      return;
    }
    const messageText = userInput.trim();
    setUserInput("");
    
    if (activeChat) {
      updateChatHistory(activeChat, {
        role: "user",
        text: messageText,
        timestamp: Date.now()
      });
    }
    
    await streamIAResponse(messageText);
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newChat = { 
      id: newId, 
      title: `Chat ${chats.length + 1}`,
      createdAt: new Date().toISOString()
    };
    
    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setOriginalChats(updatedChats);
    setChatHistories(prev => ({ ...prev, [newId]: [] }));
    setActiveChat(newId);
    
    localStorage.setItem("chats", JSON.stringify(updatedChats));
    localStorage.setItem("chatHistories", JSON.stringify({ ...chatHistories, [newId]: [] }));
    
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

  const handleEditChatTitle = (chatId, newTitle) => {
    const updateChatsArray = (chatsArray) => 
      chatsArray.map(chat => chat.id === chatId ? { ...chat, title: newTitle } : chat);
    
    setChats(updateChatsArray);
    setOriginalChats(updateChatsArray);
    
    const updatedChats = updateChatsArray(chats);
    localStorage.setItem("chats", JSON.stringify(updatedChats));
  };


  
    
  
    


  const handleSearchChats = (query) => {
    if (query.trim() === "") {
      setChats(originalChats);
    } else {
      const filtered = originalChats.filter(chat => 
        chat.title.toLowerCase().includes(query.toLowerCase())
      );
      setChats(filtered);
    }
  };

  // Cargar chats al montar el componente
  useEffect(() => {
    loadChatsFromBackend();
  }, [loadChatsFromBackend]);

  return (
    <div className={`ai-main ${theme === "dark" ? "ai-dark-bg" : "ai-light-bg"}`}>
      <Sidebar
        onNewChat={handleNewChat}
        onEditChatTitle={handleEditChatTitle}
        // onDeleteChat={handleDeleteChat}
        chats={chats}
        activeChat={activeChat}
        onSearch={handleSearchChats}
        onSelectChat={handleSelectChat}
      />

      <div className="ai-content">
        <button className="ai-mode-toggle" onClick={toggleTheme} title="Cambiar Tema">
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>

        <button className="ai-config-button" onClick={() => setShowMenu(!showMenu)} title="Configuración">
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
          <div className="ai-input-wrapper">
            <textarea
              className="ai-input"
              placeholder="Escribe tu mensaje aquí..."
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
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
            <button type="submit" className="ai-submit-button" disabled={loading || isStreaming || userInput.trim() === ""}>
              <Send size={16} />
            </button>
          </div>
        </form>

        {(loading || isStreaming) && (
          <div className="ai-typing-indicator">
            <span></span>
            <div className="typing-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}