// Sidebar.jsx
import React from "react";
import PropTypes from "prop-types";
import { MessageCircle, Search, Settings } from "lucide-react";

export default function Sidebar({ onNewChat, onSelectChat, chats, activeChat }) {
    const handleKeyDown = (e, chatId) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectChat(chatId);
        }
    };

    return (
        <aside className="ai-sidebar">
            <div className="ai-sidebar-title">
                <Settings style={{ marginRight: 8 }} />
                <span>Tikee Neural</span>
            </div>
            
            <button className="ai-new-chat-btn" onClick={onNewChat}>
                <MessageCircle size={18} /> Nuevo chat
            </button>
            
            <div className="ai-search">
                <Search size={16} /> 
                <span>Buscar chats</span>
            </div>
            
            <div className="ai-chat-list">
                {chats.map(chat => (
                    <button
                        key={chat.id}
                        className={`ai-chat-list__item${chat.id === activeChat ? " active" : ""}`}
                        onClick={() => onSelectChat(chat.id)}
                        onKeyDown={(e) => handleKeyDown(e, chat.id)}
                        type="button"
                    >
                        {chat.title}
                    </button>
                ))}
            </div>
        </aside>
    );
}

// Validación de PropTypes
Sidebar.propTypes = {
    onNewChat: PropTypes.func.isRequired,
    onSelectChat: PropTypes.func.isRequired,
    chats: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            title: PropTypes.string.isRequired
        })
    ).isRequired,
    activeChat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};