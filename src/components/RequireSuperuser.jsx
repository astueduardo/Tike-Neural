import { Navigate, Outlet } from "react-router-dom";

function RequireSuperuser() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "superuser") {
    return <Navigate to="/login" />;
}
    return <Outlet />;
}

export default RequireSuperuser;