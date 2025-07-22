import { Navigate, Outlet } from "react-router-dom";

const RequireRole = ({ role }) => {
  // Verificar token primero
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Intentar obtener y parsear usuario
  let user = null;
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      user = JSON.parse(userData);
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
    // Si hay error parseando, limpiar localStorage y redirigir
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  // Si no hay usuario o no tiene el rol correcto
  if (!user || user.role !== role) {
    // Redirigir según el rol actual del usuario o al login si no hay usuario
    if (user && user.role) {
      switch (user.role) {
        case "admin":
          return <Navigate to="/super-dashboard" replace />;
        case "analista":
          return <Navigate to="/analista" replace />;
        default:
          return <Navigate to="/all-interface" replace />;
      }
    }
    return <Navigate to="/login" replace />;
  }

  // Si tiene el rol correcto, renderizar las rutas hijas
  return <Outlet />;
};

export default RequireRole;
