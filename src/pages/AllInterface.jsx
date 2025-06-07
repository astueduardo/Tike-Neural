import { useState } from "react";
import api from "../api/axios";

function AIInterface() {
    const [userInput, setUserInput] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [showMenu, setShowMenu] = useState(false);

    const [chats, setChats] = useState([
        { id: 1, name: "Nuevo chat", active: true },
        { id: 2, name: "Buscar chats", active: false },
    ]);

    const handleToggleMode = () => setDarkMode((prev) => !prev);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAiResponse("");
        try {
            const response = await api.post("/neural/respond", { question: userInput });
            setAiResponse(response.data.answer);
        } catch {
            setAiResponse("Error fetching response from AI.");
        }
        setLoading(false);
    };

    const handleClear = () => {
        setUserInput("");
        setAiResponse("");
    };

    const handleSelectChat = (id) => {
        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.id === id
                    ? { ...chat, active: true }
                    : { ...chat, active: false }
            )
        );
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const handleChangeUser = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div className={darkMode ? "ai-dark-bg" : "ai-light-bg"} style={{ minHeight: "100vh", display: "flex" }}>
            <aside className="ai-sidebar">
                <div className="ai-sidebar-title">Tikee Neural</div>
                <div className="ai-sidebar-list">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`ai-sidebar-item${chat.active ? " active" : ""}`}
                            onClick={() => handleSelectChat(chat.id)}
                            style={{ cursor: "pointer" }}
                        >
                            {chat.name}
                        </div>
                    ))}
                </div>
            </aside>
            <main className="ai-main" style={{ position: "relative" }}>
                {/* Botón de configuración */}
                <button
                    className="ai-config-button"
                    title="Configuración"
                    onClick={() => setShowMenu((prev) => !prev)}
                    style={{
                        position: "absolute",
                        top: "1.5rem",
                        right: "1.5rem",
                        background: "none",
                        border: "none",
                        fontSize: "1.7rem",
                        cursor: "pointer",
                        color: "#3bb6ff",
                        zIndex: 20,
                    }}
                >
                    ⚙️
                </button>
                {showMenu && (
                    <div className={`ai-config-menu-box${!darkMode ? " light" : ""}`}>
                        <button className="ai-config-menu-btn" onClick={handleChangeUser}>
                            Cambiar de usuario
                        </button>
                        <button className="ai-config-menu-btn" onClick={handleLogout}>
                            Cerrar sesión
                        </button>
                    </div>
                )}

                <button className="ai-mode-toggle" title="Cambiar modo" onClick={handleToggleMode}>
                    {darkMode ? "🌙" : "☀️"}
                </button>
                <div className={`ai-title ${darkMode ? "text-white" : "text-black"}`}>
                    ¿En qué puedo ayudarte?
                </div>
                <form onSubmit={handleSubmit} className="ai-form">
                    <textarea
                        placeholder="Pregunta lo que quieras"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        required
                        rows={3}
                        className="ai-input"
                    />
                    <div className="ai-form-buttons">
                        <button type="submit" className="ai-submit-button" disabled={loading}>
                            {loading ? "Enviando..." : "Enviar"}
                        </button>
                        <button type="button" onClick={handleClear} className="ai-clear-button">
                            Limpiar
                        </button>
                    </div>
                </form>
                {loading && (
                    <div className="ai-loading" style={{ marginTop: 16 }}>
                        <span> Escribiendo respuesta...</span>
                    </div>
                )}
                {aiResponse && (
                    <div className="ai-response">
                        <strong>Respuesta de la IA:</strong>
                        <p>{aiResponse}</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AIInterface;