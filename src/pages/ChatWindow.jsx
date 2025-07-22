// ChatWindow.jsx
import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";

import "../styles/Allterface.css";
export default function ChatWindow({ chatHistory = [], streamingText, isStreaming, error }) {
    const chatRef = useRef(null);

    // Scroll automático
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [chatHistory, streamingText]);

    // Función para formatear timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
            return date.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    return (
        <>
            {error && <div className="ai-error">{error}</div>}
            <div className="ai-chat-history" ref={chatRef}>
                {chatHistory.length === 0 && !isStreaming ? (               
                    <div className="ai-title" >¿En qué puedo ayudarte?</div>
                ) : (  
                    chatHistory.map((msg) => (
                        <div key={msg.id || `${msg.role}-${msg.timestamp}`} className={`ai-chat-bubble ${msg.role === "user" ? "user" : "ia"}`}>
                            <div className="message-content">{msg.text}</div>
                            {msg.timestamp && (
                                <div className="message-timestamp">
                                    {formatTimestamp(msg.timestamp)}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {isStreaming && (
                    <div className="ai-chat-bubble ia">
                        <div className="message-content">
                            {streamingText} {}
                            <span className="blinking-cursor">Escribiendo . . . </span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// Validación de PropTypes
ChatWindow.propTypes = {
    chatHistory: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            role: PropTypes.oneOf(['user', 'ia']).isRequired,
            text: PropTypes.string.isRequired,
            timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        })
    ),
    streamingText: PropTypes.string,
    isStreaming: PropTypes.bool,
    error: PropTypes.string
};

ChatWindow.defaultProps = {
    chatHistory: [],
    streamingText: "",
    isStreaming: false,
    error: ""
};
