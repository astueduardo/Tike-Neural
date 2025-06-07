import { useState } from "react";
import api from "../api/axios"; 
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
      });
      alert("Registro exitoso");
      navigate("/login");
    } catch (err) {
      alert("Error al registrarse");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleRegister} className="form-container">
        <h2 className="text-2xl font-bold mb-6 text-center">Crear cuenta</h2>

        <input                  
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="input-style"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-style"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-style"
        />
        <button
          type="submit"
          className="button-green"
        >
          Registrarse
        </button>

        <p className="text-center mt-4 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
