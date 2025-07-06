// ConfigMenu.jsx
import React from "react";
import PropTypes from "prop-types";

export default function ConfigMenu({ onLogout }) {
    const user = JSON.parse(localStorage.getItem("user"));
    
    return (
        <div className="ai-config-menu">
            {user?.role === "admin" && (
                <button 
                    className="ai-config-menu__btn"
                    onClick={() => onLogout("admin")}
                >
                    Administrador
                </button>
            )}
            {user?.role === "analista" && (
                <button 
                    className="ai-config-menu__btn"
                    onClick={() => onLogout("analista")}
                >
                    Analista
                </button>
            )}
            <button 
                className="ai-config-menu__btn"
                onClick={() => onLogout("logout")}
            >
                Cerrar sesión
            </button>
        </div>
    );
}

// Validación de PropTypes
ConfigMenu.propTypes = {
    onLogout: PropTypes.func.isRequired
};