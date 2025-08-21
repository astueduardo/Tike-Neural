import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Allnterface from "./pages/Allnterface";
import PrivateRoute from "./components/PrivateRoute";
import RequireRole from "./components/RequiereRole";
import AnalistaPage from "./pages/AnalistaPage";
import SuperDashboard from "./pages/SuperDashboard";

function App() {
  return (
    <Routes>
      {/* Ruta principal - redirige al login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rutas privadas */}
      <Route
        path="/all-interface"
        element={
          <PrivateRoute>
            <Allnterface />
          </PrivateRoute>
        }
      />

      {/* Rutas con roles específicos */}
      <Route element={<RequireRole role="admin" />}>
        <Route path="/super-dashboard" element={<SuperDashboard />} />
      </Route>
      <Route element={<RequireRole role="analista" />}>
        <Route path="/analista" element={<AnalistaPage />} />
      </Route>

      {}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
