// AuthContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Inicializar usuario desde localStorage si existe
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Error parsing saved user:", error);
      localStorage.removeItem("user");
      return null;
    }
  });

  // Verificar token al inicializar
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    return !!(token && savedUser);
  });

  // Estado de carga para operaciones asíncronas
  const [isLoading, setIsLoading] = useState(false);

  // Función de login
  const login = useCallback((userData, token) => {
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  }, []);

  // Función logout mejorada
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("chats");
    localStorage.removeItem("chatHistories");
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  // Verificar si el token sigue siendo válido
  const checkAuthStatus = useCallback(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error("Error parsing user data:", error);
        logout();
        return false;
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, [logout]);

  // Función para actualizar datos del usuario
  const updateUser = useCallback(
    (newUserData) => {
      try {
        const updatedUser = { ...user, ...newUserData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      } catch (error) {
        console.error("Error updating user:", error);
        return false;
      }
    },
    [user],
  );

  // Verificar si el usuario tiene un rol específico
  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      return user.role === role || user.roles?.includes(role);
    },
    [user],
  );

  // Verificar estado de autenticación al montar
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Limpiar datos si el token expira o es inválido
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token" && !e.newValue) {
        // Si el token fue eliminado desde otra pestaña
        logout();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout]);

  // Memoizar el valor para evitar renders innecesarios
  const value = useMemo(
    () => ({
      user,
      setUser,
      login,
      logout,
      isAuthenticated,
      isLoading,
      setIsLoading,
      checkAuthStatus,
      updateUser,
      hasRole,
    }),
    [
      user,
      setUser,
      login,
      logout,
      isAuthenticated,
      isLoading,
      setIsLoading,
      checkAuthStatus,
      updateUser,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
