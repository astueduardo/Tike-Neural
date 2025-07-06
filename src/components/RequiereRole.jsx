import { Navigate, Outlet } from "react-router-dom";

const RequireRole = ({ role }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== role) {
    return <Navigate to="/login" />;
  }
  return <Outlet />;
};

export default RequireRole;