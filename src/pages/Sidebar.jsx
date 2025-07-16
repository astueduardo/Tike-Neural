// Sidebar.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { MessageCircle, Search, Settings } from "lucide-react";

export default function Sidebar({ onNewChat, onSelectChat, chats, activeChat, onSearch, onEditChatTitle }) {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        onSearch(query); // Llama a la función de búsqueda en el componente padre
    };


    return (
        <aside className="ai-sidebar">
            <div className="ai-sidebar-title">
                <Settings style={{ marginRight: 8 }} />
                <span>Tikee Neural</span>
            </div>
            
            <button 
                className="ai-new-chat-btn" 
                onClick={() => onNewChat()}
            >
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
                {chats.map(chat => (
                    <div key={chat.id} className="ai-chat-list__item-wrapper">
                        <button
                            className={`ai-chat-list__item${chat.id === activeChat ? " active" : ""}`}
                            onClick={() => onSelectChat(chat.id)}
                            type="button"
                        >

                            {chat.title}
       
                        <button
                            className="ai-edit-chat-btn"
                            onClick={() => {
                                const newTitle = prompt("Editar nombre del chat:", chat.title);
                                if (newTitle) onEditChatTitle(chat.id, newTitle);
                            }}
                            title="Editar nombre"
                            > 
                            <div className="nose">   
                                <svg  xmlns="http://www.w3.org/2000/svg" className="icon12" >
                                <path d="M15.498 8.50159C16.3254 8.50159 16.9959 9.17228 16.9961 9.99963C16.9961 10.8271 16.3256 11.4987 15.498 11.4987C14.6705 11.4987 14 10.8271 14 9.99963C14.0002 9.17228 14.6706 8.50159 15.498 8.50159Z" />
                                <path d="M4.49805 8.50159C5.32544 8.50159 5.99689 9.17228 5.99707 9.99963C5.99707 10.8271 5.32555 11.4987 4.49805 11.4987C3.67069 11.4985 3 10.827 3 9.99963C3.00018 9.17239 3.6708 8.50176 4.49805 8.50159Z" />
                                <path d="M10.0003 8.50159C10.8276 8.50176 11.4982 9.17239 11.4984 9.99963C11.4984 10.827 10.8277 11.4985 10.0003 11.4987C9.17283 11.4987 8.50131 10.8271 8.50131 9.99963C8.50149 9.17228 9.17294 8.50159 10.0003 8.50159Z" />
                                </svg>   
                            </div>
                        </button>
                                            
    
                        </button>

                    </div>
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
    activeChat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onEditChatTitle: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired
};