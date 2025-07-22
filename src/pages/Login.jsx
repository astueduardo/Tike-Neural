import React, { useState } from "react";
import api from "../api/axios.js";
import { useNavigate, Link } from "react-router-dom";

;
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();




  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    
    try {
      const res = await api.post("/auth/login", { 
        email, 
        password 
      });
    
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/all-interface");
    } catch (err) {
      //manejo de errores
      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          setPassword("");
          setPasswordError("Contraseña incorrecta");
        } else if (status === 404) {
          setEmail("");
          setEmailError("Usuario no encontrado");
        } else {
          setEmailError(err.response.data.message || "Ocurrió un error. Intenta más tarde.");
        }
      } else if (err.request) {
        setEmailError("Sin conexión al servidor. Verifica tu conexión.");
      } else {
        setEmailError("Error al procesar la solicitud.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <img src="/public/el.png" alt="icon" className="icon" />
      <span className="logo">TIKÉE NEURAL </span>
      
      <form onSubmit={handleLogin} className="form-container">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>
        <input
          id="email"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          className={`input-style ${emailError ? "error" : ""}`}
        />
        {emailError && <div style={{ color: "red", marginBottom: 8 }}>{emailError}</div>}
        <input
          id="password"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className={`input-style ${passwordError ? "error" : ""}`}
        />
        {passwordError && <div style={{ color: "red", marginBottom: 8 }}>{passwordError}</div>}
        <button type="submit" className="button-green" disabled={loading}>
          {loading ? "Cargando..." : "Iniciar Sesión"}
        </button>
        <p className="text-center mt-4 text-sm">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
