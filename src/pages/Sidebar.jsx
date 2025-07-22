import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { MessageCircle, Search, Settings } from "lucide-react";

export default function Sidebar({
  onNewChat,
  onSelectChat,
  chats,
  activeChat,
  onSearch,
  onEditChatTitle,
  onDeleteChat,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpenChatId, setMenuOpenChatId] = useState(null);
  const menuRef = useRef(null);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    onSearch(query);
  };

  const toggleMenu = (chatId) => {
    setMenuOpenChatId((prev) => (prev === chatId ? null : chatId));
  };

  // Cerrar el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenChatId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="ai-sidebar">
      <div className="ai-sidebar-title">
        <img src="/public/el.png" alt="icon"  />
        <span>Tikee Neural</span>
      </div>

      <button className="ai-new-chat-btn" onClick={onNewChat}>
        <MessageCircle size={18} /> Nuevo chat
      </button>

      <div className="ai-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar chats..."
          value={searchQuery}
          onChange={handleSearch}
          className="ai-chat-history"
        />
      </div>

      <div className="ai-chat-list">
        {chats.map((chat) => (
          <div key={chat.id} className="ai-chat-list__item-wrapper" style={{ position: "relative" }}>
            <div
              className={`ai-chat-list__item${chat.id === activeChat ? " active" : ""}`}
              onClick={() => onSelectChat(chat.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelectChat(chat.id);
              }}
            >
              <span>{chat.title}</span>
            </div>

            <div ref={menuRef}>
              <button
                className="ai-edit-chat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(chat.id);
                }}
                title="Opciones"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-ellipsis"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>

              {menuOpenChatId === chat.id && (
                <div className="ai-chat-popup-menu">
                  <button
                    className="ai-chat-popup-item"
                    onClick={() => {
                      const newTitle = prompt("Editar nombre del chat:", chat.title);
                      if (newTitle) onEditChatTitle(chat.id, newTitle);
                      setMenuOpenChatId(null);
                    }}
                  >
                    Editar nombre
                  </button>
                  <button
                    className="ai-chat-popup-item danger"
                    onClick={() => {
                      const confirmDelete = confirm("¿Seguro que deseas eliminar este chat?");
                      if (confirmDelete) onDeleteChat(chat.id);
                      setMenuOpenChatId(null);
                    }}
                  >
                    Eliminar chat
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  onNewChat: PropTypes.func.isRequired,
  onSelectChat: PropTypes.func.isRequired,
  onEditChatTitle: PropTypes.func.isRequired,
  onDeleteChat: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  chats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeChat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
