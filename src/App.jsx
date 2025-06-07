import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AllInterfaz from "./pages/AllInterface";
import SuperDashboard from "./pages/SuperDashboard";
import RequireSuperuser from "./components/RequireSuperuser";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/all-interface" element={<AllInterfaz />} />
        <Route element={<RequireSuperuser />}>
          <Route path="/super-dashboard" element={<SuperDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
