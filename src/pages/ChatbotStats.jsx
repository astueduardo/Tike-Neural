import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import requestService from "../services/requestService";

// Colores para los módulos
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ChatbotStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Intentamos usar requestService si devuelve respuesta consistente
        let res = null;
        try {
          res = await requestService.makeRequest(
            `${import.meta.env.VITE_API_URL}/neural/chats`
          );
        } catch {
          // Si requestService falla, intentamos fetch directo (incluye token)
          const token = localStorage.getItem("token");
          res = await fetch(`${import.meta.env.VITE_API_URL}/neural/chats`, {
            method: "GET",
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
        }

        // Si res es un Response de fetch
        let data;
        if (typeof res.json === "function") {
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(txt || `HTTP ${res.status}`);
          }
          data = await res.json();
        } else {
          // Si requestService ya devolvió body parsed
          data = res;
        }

        const chats = Array.isArray(data)
          ? data
          : Array.isArray(data.chats)
          ? data.chats
          : [];

        // Normalizar si no es array
        if (!Array.isArray(chats)) throw new Error("Formato de chats inválido");

        // Total de chats
        const totalChats = chats.length;

        // Usuarios únicos
        const usuariosUnicosSet = new Set(chats.map((c) => c.userId));
        const usuariosUnicos = usuariosUnicosSet.size;

        // Usuarios activos últimas 24h
        const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activosSet = new Set(
          chats
            .filter((c) => new Date(c.createdAt) > hace24h)
            .map((c) => c.userId)
        );
        const activos24h = activosSet.size;
        const inactivos = usuariosUnicos - activos24h;

        // Promedio de chats por usuario
        const promedioChatsUsuario = usuariosUnicos ? totalChats / usuariosUnicos : 0;

        // Chats por módulo
        const chatsPorModulo = {};
        chats.forEach((c) => {
          const mod = c.module || "Desconocido";
          chatsPorModulo[mod] = (chatsPorModulo[mod] || 0) + 1;
        });

        // Formato para gráfico de pastel
        const pieData = Object.entries(chatsPorModulo).map(([name, value]) => ({
          name,
          value,
        }));

        // Datos para gráfico de barras (activos vs inactivos)
        const barData = [
          { name: "Activos", usuarios: activos24h },
          { name: "Inactivos", usuarios: inactivos },
        ];

        setStats({
          totalChats,
          usuariosUnicos,
          activos24h,
          inactivos,
          promedioChatsUsuario,
          pieData,
          barData,
        });
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        setStats({
          totalChats: 0,
          usuariosUnicos: 0,
          activos24h: 0,
          inactivos: 0,
          promedioChatsUsuario: 0,
          pieData: [],
          barData: [],
        });
      }
    };

    // primer fetch y polling cada 30s
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <p>Cargando estadísticas...</p>;

  return (
    <div className="p-4 grid gap-6">
      {/* Tarjetas de datos generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500 text-white p-4 rounded-xl">
          <p className="text-sm">Total de Chats</p>
          <p className="text-2xl font-bold">{stats.totalChats}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-xl">
          <p className="text-sm">Usuarios nuevos</p>
          <p className="text-2xl font-bold">{stats.usuariosUnicos}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded-xl">
          <p className="text-sm">Activos (24h)</p>
          <p className="text-2xl font-bold">{stats.activos24h}</p>
        </div>
        <div className="bg-purple-500 text-white p-4 rounded-xl">
          <p className="text-sm">Promedio Chats/Usuario</p>
          <p className="text-2xl font-bold">
            {stats.promedioChatsUsuario.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de pastel */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4"> Comparación</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {stats.pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de barras */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-bold mb-4">Usuarios Activos - Inactivos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="usuarios" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}