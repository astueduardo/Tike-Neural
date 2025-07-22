import { useState} from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  MessageSquare, Users, Clock, AlertTriangle, Settings, Search, 
  Filter, Edit, Save, Play, Brain, Database, GitBranch, User,
  CheckCircle, XCircle, AlertCircle, TrendingUp, Activity
} from 'lucide-react';

const ChatbotAnalystInterface = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [simulationInput, setSimulationInput] = useState('');

  // Datos de ejemplo para métricas
  const dashboardData = {
    activeChats: 47,
    totalMessages: 1284,
    avgResponseTime: 2.3,
    humanEscalations: 12,
    aiSuccess: 87.2,
    userSatisfaction: 4.2
  };

  const conversationData = [
    { hour: '09:00', messages: 45, escalations: 2 },
    { hour: '10:00', messages: 67, escalations: 3 },
    { hour: '11:00', messages: 89, escalations: 5 },
    { hour: '12:00', messages: 123, escalations: 8 },
    { hour: '13:00', messages: 98, escalations: 4 },
    { hour: '14:00', messages: 76, escalations: 3 }
  ];

  const topicsData = [
    { name: 'Soporte técnico', value: 35, color: '#8884d8' },
    { name: 'Facturación', value: 25, color: '#82ca9d' },
    { name: 'Cancelaciones', value: 20, color: '#ffc658' },
    { name: 'Información general', value: 15, color: '#ff7300' },
    { name: 'Otros', value: 5, color: '#00ff88' }
  ];

  const conversations = [
    { 
      id: 1, 
      user: 'Usuario_123', 
      status: 'Resuelto por IA', 
      topic: 'Soporte técnico', 
      time: '14:30', 
      satisfaction: 5,
      messages: [
        { sender: 'user', text: 'Mi aplicación no carga correctamente' },
        { sender: 'ai', text: 'Entiendo tu problema. ¿Podrías decirme qué dispositivo estás usando?' },
        { sender: 'user', text: 'iPhone 12 con iOS 15' },
        { sender: 'ai', text: 'Intenta cerrar completamente la app y reiniciarla. También verifica que tengas la última versión instalada.' },
        { sender: 'user', text: 'Funcionó! Gracias' }
      ]
    },
    { 
      id: 2, 
      user: 'Usuario_456', 
      status: 'Escalado a humano', 
      topic: 'Facturación', 
      time: '14:15', 
      satisfaction: 3,
      messages: [
        { sender: 'user', text: 'Me cobraron doble este mes' },
        { sender: 'ai', text: 'Lamento escuchar eso. Voy a revisar tu cuenta.' },
        { sender: 'ai', text: 'No puedo acceder a los detalles específicos de facturación. Te conectaré con un agente humano.' }
      ]
    }
  ];


  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chats Activos</p>
              <p className="text-2xl font-bold text-blue-600">{dashboardData.activeChats}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mensajes Total</p>
              <p className="text-2xl font-bold text-green-600">{dashboardData.totalMessages}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tiempo Respuesta</p>
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.avgResponseTime}s</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Escalaciones</p>
              <p className="text-2xl font-bold text-red-600">{dashboardData.humanEscalations}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
  
    </div>

      {/* Alertas */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
          Alertas Recientes
        </h3>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Actividad por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="messages" stroke="#8884d8" name="Mensajes" />
              <Line type="monotone" dataKey="escalations" stroke="#82ca9d" name="Escalaciones" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Temas Más Comunes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topicsData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {topicsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderConversations = () => (
    <div className="space-y-6">
      {/* Filtros de búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              className="border rounded-lg px-3 py-2 w-64"
            />
          </div>
          <select className="border rounded-lg px-3 py-2">
            <option>Todos los estados</option>
            <option>Resuelto por IA</option>
            <option>Escalado a humano</option>
            <option>En progreso</option>
          </select>
          <select className="border rounded-lg px-3 py-2">
            <option>Todos los temas</option>
            <option>Soporte técnico</option>
            <option>Facturación</option>
            <option>Cancelaciones</option>
          </select>
          <input type="date" className="border rounded-lg px-3 py-2" />
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Lista */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Conversaciones Recientes</h3>
            <div className="space-y-3">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conv.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{conv.user}</span>
                    <span className="text-sm text-gray-500">{conv.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      conv.status === 'Resuelto por IA' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {conv.status}
                    </span>
                    <span className="text-sm text-gray-600">{conv.topic}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < conv.satisfaction ? 'bg-yellow-400' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalle de conversación */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Detalle de Conversación</h3>
            {selectedConversation ? (
              <div className="border rounded-lg p-4">
                <div className="mb-4">
                  <h4 className="font-medium">{selectedConversation.user}</h4>
                  <p className="text-sm text-gray-600">{selectedConversation.topic} • {selectedConversation.time}</p>
                </div>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {selectedConversation.messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3 rounded-lg ${
                        msg.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        {msg.sender === 'ai' && (
                          <div className="flex space-x-2 mt-2">
                            <button className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              <CheckCircle className="h-3 w-3" />
                            </button>
                            <button className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                              <XCircle className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <textarea
                  placeholder="Añadir notas sobre esta conversación..."
                  className="w-full p-3 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                Selecciona una conversación para ver los detalles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderKnowledge = () => (
    <div className="space-y-6">

      {/* Simulador */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center ">
          <Play className="h-5 w-5 mr-2" />
          Simulador de IA
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prueba una pregunta:</label>
            <input
              type="text"
              value={simulationInput}
              onChange={(e) => setSimulationInput(e.target.value)}
              placeholder="Ej: Mi aplicación no funciona"
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <button className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
            Simular Respuesta
          </button>
          {simulationInput && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Intención detectada:</p>
                  <p className="text-blue-600">problema_tecnico (89%)</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Entidades:</p>
                  <p className="text-green-600">aplicación, no funciona</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Respuesta sugerida:</p>
                <p className="mt-2 p-3 bg-white border rounded">
                  Entiendo que tienes problemas con la aplicación. ¿Podrías decirme qué dispositivo estás usando y qué error específico estás viendo?
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'conversations', label: 'Conversaciones', icon: MessageSquare },
    { id: 'knowledge', label: 'Conocimiento', icon: Database },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel del Analista</h1>
              <p className="text-sm text-gray-600">Sistema de gestión de IA</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Sistema activo</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">Analista Principal</span>
              </div>    
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'conversations' && renderConversations()}
        {activeTab === 'knowledge' && renderKnowledge()}
      </main>
    </div>
  );
};

export default ChatbotAnalystInterface;