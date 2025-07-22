// ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Cambiamos a 'theme' para consistencia con AllInterface
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem("theme");
        return saved || "light";
    });

    useEffect(() => {
        localStorage.setItem("theme", theme);
        // Aplicar clase al body para CSS global si es necesario
        document.body.className = theme === "dark" ? "dark-theme" : "light-theme";
    }, [theme]);

    // Función toggle que espera AllInterface
    const toggleTheme = () => {
        setTheme(prev => prev === "dark" ? "light" : "dark");
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}