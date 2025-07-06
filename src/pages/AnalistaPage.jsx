// AnalistaPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function AnalistaPage() {
    const [reportes, setReportes] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        cargarReportes();
    }, []);

    const cargarReportes = async () => {
        setLoading(true);
        try {
            const res = await api.get("/reportes");
            setReportes(res.data);
        } catch (error) {
            console.error("Error cargando reportes:", error);
            setReportes([]);
        }
        setLoading(false);
    };

    const reportesFiltrados = reportes.filter(r =>
        r.titulo?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleModalKeyDown = (e) => {
        if (e.key === 'Escape') {
            setReporteSeleccionado(null);
        }
    };

    const handleModalClick = (e) => {
        if (e.target === e.currentTarget) {
            setReporteSeleccionado(null);
        }
    };

    return (
        <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
            <h2>Panel de Analista</h2>
            <p>Bienvenido al panel de analista. Aquí podrás ver y descargar reportes.</p>

            <div style={{ margin: "2rem 0" }}>
                <input
                    type="text"
                    placeholder="Buscar reporte..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    style={{ padding: 8, width: 250, marginRight: 16 }}
                />
                <button onClick={cargarReportes} disabled={loading}>
                    {loading ? "Cargando..." : "Actualizar"}
                </button>
            </div>

            {loading ? (
                <div>Cargando reportes...</div>
            ) : (
                <table style={{ width: "100%", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: 8 }}>Título</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Fecha</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportesFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ padding: 16, textAlign: "center" }}>
                                    No hay reportes para mostrar.
                                </td>
                            </tr>
                        )}
                        {reportesFiltrados.map((reporte) => (
                            <tr key={reporte.id}>
                                <td style={{ padding: 8 }}>{reporte.titulo}</td>
                                <td style={{ padding: 8 }}>{reporte.fecha}</td>
                                <td style={{ padding: 8 }}>
                                    <button onClick={() => setReporteSeleccionado(reporte)}>
                                        Ver detalles
                                    </button>
                                    <a
                                        href={reporte.urlDescarga}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ marginLeft: 12 }}
                                    >
                                        Descargar
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal de detalles - CORREGIDO */}
            {reporteSeleccionado && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.3)",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                    onClick={handleModalClick}
                    onKeyDown={handleModalKeyDown}
                    tabIndex={-1}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: 32,
                            borderRadius: 12,
                            minWidth: 320,
                            maxWidth: 500,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 id="modal-title">{reporteSeleccionado.titulo}</h3>
                        <p><b>Fecha:</b> {reporteSeleccionado.fecha}</p>
                        <p><b>Descripción:</b> {reporteSeleccionado.descripcion}</p>
                        <button 
                            onClick={() => setReporteSeleccionado(null)} 
                            style={{ marginTop: 16 }}
                            autoFocus
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}