// AllInterface.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const localKey = (key) => `${key}_${user?.id || "guest"}`;
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [chats, setChats] = useState([]);
  const [chatHistories, setChatHistories] = useState({});
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [originalChats, setOriginalChats] = useState([]);
  const abortControllerRef = useRef(null);

  const [activeChat, setActiveChat] = useState(
    () => localStorage.getItem(localKey("activeChat")) || null,
  );

  const saveActiveChat = (chatId) => {
    setActiveChat(chatId);
    localStorage.setItem(localKey("activeChat"), chatId);
  };

  const loadChatsFromBackend = useCallback(async () => {
    const token = localStorage.getItem("token");
    const savedActiveChat = localStorage.getItem(localKey("activeChat"));

    // Leer userId de query string: /all-interface?userId=...
    const params = new URLSearchParams(location.search);
    const targetUserId = params.get("userId");

    if (!token) {
      const savedChats =
        JSON.parse(localStorage.getItem(localKey("chats"))) || [];
      const savedHistories =
        JSON.parse(localStorage.getItem(localKey("chatHistories"))) || {};
      setChats(savedChats);
      setOriginalChats(savedChats);
      setChatHistories(savedHistories);

      if (savedChats.length > 0) {
        setActiveChat(savedActiveChat || savedChats[savedChats.length - 1].id);
      }
      return;
    }

    try {
      // Si hay targetUserId y el usuario actual es admin/analista, pedir /chats/{userId}
      const isAnalystOrAdmin = user?.role === "analista" || user?.role === "admin";
      const endpoint = targetUserId && isAnalystOrAdmin
        ? `${import.meta.env.VITE_API_URL}/chats/${targetUserId}`
        : `${import.meta.env.VITE_API_URL}/neural/chats`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);

      const data = await response.json();

      // Normalizar: backend puede devolver { chats: [...] } o directamente { chats: [...] } o array
      let chatsArray;
      if (Array.isArray(data)) {
        chatsArray = data;
      } else if (Array.isArray(data?.chats)) {
        chatsArray = data.chats;
      } else {
        chatsArray = [];
      }

      // Transformar igual que antes
      const transformedChats = chatsArray.map((chat) => {
        const firstMessage = chat.messages?.[0];
        return {
          id: chat.id,
          title: firstMessage?.question
            ? firstMessage.question.slice(0, 20) +
              (firstMessage.question.length > 20 ? "..." : "")
            : `Chat ${new Date(chat.createdAt).toLocaleDateString()}`,
          createdAt: chat.createdAt,
        };
      });

      const histories = {};
      chatsArray.forEach((chat) => {
        histories[chat.id] = chat.messages
          .map((msg) => [
            {
              role: "user",
              text: msg.question,
              timestamp: new Date(msg.timestamp).getTime(),
            },
            {
              role: "ia",
              text: msg.answer,
              timestamp: new Date(msg.timestamp).getTime() + 1000,
            },
          ])
          .flat();
      });

      setChats(transformedChats);
      setOriginalChats(transformedChats);
      setChatHistories(histories);

      localStorage.setItem(localKey("chats"), JSON.stringify(transformedChats));
      localStorage.setItem(localKey("chatHistories"), JSON.stringify(histories));

      // Si venimos con userId, seleccionar el primer/último chat disponible
      if (targetUserId && transformedChats.length > 0) {
        setActiveChat(transformedChats[transformedChats.length - 1].id);
      } else if (!activeChat && transformedChats.length > 0) {
        setActiveChat(transformedChats[transformedChats.length - 1].id);
      }
    } catch (error) {
      console.error("Error cargando chats desde backend:", error);
    }
  }, [user, location.search]);

  const updateChatHistory = useCallback(
    (chatId, message) => {
      setChatHistories((prev) => {
        const updated = {
          ...prev,
          [chatId]: [...(prev[chatId] || []), message],
        };
        localStorage.setItem(
          localKey("chatHistories"),
          JSON.stringify(updated),
        );
        return updated;
      });
    },
    [user],
  );

  const streamIAResponse = async (question) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError(
        "No se encontró token de autenticación. Por favor, inicia sesión nuevamente.",
      );
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
        chatId = `temp-${Date.now()}`;
        saveActiveChat(chatId);
        setChats((prev) => [
          ...prev,
          {
            id: chatId,
            title: question.slice(0, 20) + "...",
            createdAt: new Date().toISOString(),
          },
        ]);
        setChatHistories((prev) => ({ ...prev, [chatId]: [] }));
        localStorage.setItem(localKey("activeChat"), chatId);
      }

      updateChatHistory(chatId, {
        role: "user",
        text: question,
        timestamp: Date.now(),
      });

      const bodyData = {
        question,
        module: "Conversacion",
        chatId,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/neural/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulatedText += decoder.decode(value, { stream: true });
        setStreamingText(
          (prev) => prev + decoder.decode(value, { stream: true }),
        );
      }

      const data = JSON.parse(accumulatedText);

      if (chatId.startsWith("temp-") && data?.data?.chatId) {
        const realChatId = data.data.chatId;
        saveActiveChat(realChatId);
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, id: realChatId } : c)),
        );
        setOriginalChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, id: realChatId } : c)),
        );
        setChatHistories((prev) => {
          const updated = { ...prev, [realChatId]: prev[chatId] || [] };
          delete updated[chatId];
          return updated;
        });
      }

      updateChatHistory(
        chatId.startsWith("temp-") ? data.data.chatId : chatId,
        {
          role: "ia",
          text: data?.data?.answer || "",
          timestamp: Date.now(),
        },
      );
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
    await streamIAResponse(messageText);
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newChat = {
      id: newId,
      title: `Chat ${chats.length + 1}`,
      createdAt: new Date().toISOString(),
    };

    const updatedChats = [...chats, newChat];
    setChats(updatedChats);
    setOriginalChats(updatedChats);
    setChatHistories((prev) => ({ ...prev, [newId]: [] }));
    setActiveChat(newId);

    localStorage.setItem(localKey("chats"), JSON.stringify(updatedChats));

    setError("");
    setStreamingText("");
    setIsStreaming(false);
  };

  const handleSelectChat = (chatId) => {
    saveActiveChat(chatId);
    setError("");
    setStreamingText("");
    setIsStreaming(false);
  };

  const handleEditChatTitle = (chatId, newTitle) => {
    const updateChatsArray = (chatsArray) =>
      chatsArray.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat,
      );

    setChats(updateChatsArray);
    setOriginalChats(updateChatsArray);

    localStorage.setItem(
      localKey("chats"),
      JSON.stringify(updateChatsArray(chats)),
    );
  };

  const handleSearchChats = (query) => {
    if (query.trim() === "") {
      setChats(originalChats);
    } else {
      setChats(
        originalChats.filter((chat) =>
          chat.title.toLowerCase().includes(query.toLowerCase()),
        ),
      );
    }
  };

  const handleDeleteChat = (chatId) => {
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    setChats(updatedChats);
    setOriginalChats(updatedChats);

    const updatedHistories = { ...chatHistories };
    delete updatedHistories[chatId];
    setChatHistories(updatedHistories);

    localStorage.setItem(localKey("chats"), JSON.stringify(updatedChats));
    localStorage.setItem(
      localKey("chatHistories"),
      JSON.stringify(updatedHistories),
    );

    if (activeChat === chatId) setActiveChat(null);
  };

  useEffect(() => {
    loadChatsFromBackend();
  }, [loadChatsFromBackend]);

  return (
    <div
      className={`ai-main ${theme === "dark" ? "ai-dark-bg" : "ai-light-bg"}`}
    >
      <Sidebar
        onNewChat={handleNewChat}
        onEditChatTitle={handleEditChatTitle}
        onDeleteChat={handleDeleteChat}
        chats={chats}
        activeChat={activeChat}
        onSearch={handleSearchChats}
        onSelectChat={handleSelectChat}
      />

      <div className="ai-content">
        <button className="ai-mode-toggle" onClick={toggleTheme}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>

        <button
          className="ai-config-button"
          onClick={() => setShowMenu(!showMenu)}
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
          <div className="ai-input-wrapper">
            <textarea
              className="ai-input"
              placeholder="Escribe tu mensaje aquí..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={loading || isStreaming}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
