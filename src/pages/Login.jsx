import React, { useState } from "react";
import api from "../api/axios.js";
import { useNavigate, Link } from "react-router-dom";
import { SiApmterminals } from "react-icons/si";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/all-interface");
    } catch (err) {
      // Puedes personalizar según el error que recibas del backend
      if (err.response && err.response.status === 401) {
        // Usuario o contraseña incorrectos
        setPassword("");
        setPasswordError("Contraseña incorrecta");
      } else if (err.response && err.response.status === 404) {
        // Usuario no encontrado
        setEmail("");
        setEmailError("Usuario no encontrado");
      } else {
        setPassword("");
        setPasswordError("Usuario no encontrado");
      }
    }
  };

  return (
    <div className="login-bg">
      <div className="logo">TIKÉE NEURONAL</div>
      <form onSubmit={handleLogin} className="form-container">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>

        <div className="mb-4">
          <input
            type="email"
            placeholder={emailError ? emailError : "Correo electrónico"}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            required
            className={`w-full p-3 border rounded  ${emailError ? "border-red-500" : "border-gray-300"}`}
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            placeholder={passwordError ? passwordError : "Contraseña"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            required
            className={`w-full p-3 border rounded ${passwordError ? "border-red-500" : "border-gray-300"}`}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>

        <p className="text-center mt-4 text-sm">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Crear una cuenta
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
