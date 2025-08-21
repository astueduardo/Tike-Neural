import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { MessageCircle, Search, Edit2, Trash2 } from "lucide-react";

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
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const menuRef = useRef(null);
  const editInputRef = useRef(null);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    onSearch(query);
  };

  const toggleMenu = (chatId) => {
    setMenuOpenChatId((prev) => (prev === chatId ? null : chatId));
  };
  const handleEditClick = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    setMenuOpenChatId(null);

    // Focus en el input después de que se renderice
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 100);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editingTitle.trim() && editingTitle.trim() !== "") {
      onEditChatTitle(editingChatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSubmit(e);
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const handleDeleteClick = (chatId) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas ocultar este chat? Solo se ocultará de tu vista, no se eliminará permanentemente.",
    );
    if (confirmDelete) {
      onDeleteChat(chatId);
    }
    setMenuOpenChatId(null);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        editingChatId &&
        editInputRef.current &&
        !editInputRef.current.contains(event.target)
      ) {
        handleEditCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingChatId]);

  return (
    <aside className="ai-sidebar">
      <div className="ai-sidebar-title">
        <img src="el.png" alt="icon" />
        <span>Tikee Neural</span>
      </div>

      <button className="ai-new-chat-btn" onClick={onNewChat}>
        <MessageCircle size={18} /> Nuevo chat
      </button>

      <div className="ai-search">
        <Search size={15} />
        <input
          type="text"
          placeholder="Buscar chats..."
          value={searchQuery}
          onChange={handleSearch}
          className="ai-search-input"
        />
      </div>

      <div className="ai-chat-list">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`ai-chat-list__item-wrapper${chat.id === activeChat ? " active" : ""}`}
          >
            <div
              className={`ai-chat-list__item${chat.id === activeChat ? " active" : ""}`}
              onClick={() => editingChatId !== chat.id && onSelectChat(chat.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                editingChatId !== chat.id &&
                onSelectChat(chat.id)
              }
            >
              {editingChatId === chat.id ? (
                <form onSubmit={handleEditSubmit} className="ai-edit-from">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditSubmit}
                    className="ai-edit-input"
                    maxLength={50}
                  />
                </form>
              ) : (
                <span title={chat.title}>{chat.title}</span>
              )}
            </div>
            {editingChatId !== chat.id && (
              <div
                className="ai-chat-options"
                ref={menuOpenChatId === chat.id ? menuRef : null}
              >
              <button
                className="ai-edit-chat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(chat.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu(chat.id);
                  }
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
                  <div className="ai-chat-popup-menu show">
                    <button
                      className="ai-chat-popup-menu show"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(chat.id, chat.title);
                      }}
                      type="button"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button
                      className="ai-menu-item ai-menu-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(chat.id);
                      }}
                      type="button"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
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
    }),
  ).isRequired,
  activeChat: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};
