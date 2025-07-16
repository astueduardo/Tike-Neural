import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Allnterface from "./pages/Allnterface";
import PrivateRoute from "./components/PrivateRoute";
import RequireRole from "./components/RequiereRole";
import AnalistaPage from "./pages/AnalistaPage";
import SuperDashboard from "./pages/SuperDashboard"


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/all-interface"
        element={
          <PrivateRoute>
            <Allnterface />
          </PrivateRoute>
        }
      />
      <Route element={<RequireRole role="admin" />}>
        <Route path="/super-dashboard" element={<SuperDashboard />} />
      </Route>
      <Route element={<RequireRole role="analista" />}>
        <Route path="/analista" element={<AnalistaPage />} />
      </Route>
    </Routes>
  );
}

export default App;
