// src/services/requestService.js
class RequestService {
    constructor() {
    this.activeRequests = new Map();
    this.requestQueue = new Map();
}

  // Generar key única para cada petición
generateRequestKey(url, method, data) {
    return `${method.toUpperCase()}_${url}_${JSON.stringify(data || {})}`;
}

  // Cancelar petición activa
cancelRequest(key) {
    const controller = this.activeRequests.get(key);
    if (controller) {
        controller.abort();
        this.activeRequests.delete(key);
    }
}

  // Cancelar todas las peticiones activas
cancelAllRequests() {
    for (const [, controller] of this.activeRequests) {
        controller.abort();
    }
    this.activeRequests.clear();
}

  // Hacer petición con control de duplicados
async makeRequest(url, options = {}) {
    const { 
        method = 'GET', 
        data, 
        allowDuplicates = false,
        timeout = 30000 
    } = options;

    const requestKey = this.generateRequestKey(url, method, data);

    // Cancelar petición duplicada si no se permiten duplicados
    if (!allowDuplicates && this.activeRequests.has(requestKey)) {
        this.cancelRequest(requestKey);
    }

    // Crear nuevo AbortController
    const controller = new AbortController();
    this.activeRequests.set(requestKey, controller);

    try {
        const token = localStorage.getItem("token");  
        const fetchOptions = {
        method: method.toUpperCase(),
        headers: {
            'Content-Type': 'application/json',
            'nGrok-Skip-Browser-Warning': 'true'
        },
        signal: controller.signal,
        timeout
    };

      // Agregar autenticación
    if (token) {
        fetchOptions.headers.Authorization = `Bearer ${token}`;
    } else {
        // Fallback a autenticación básica
        const basicAuth = btoa('admin:devpass123');
        fetchOptions.headers.Authorization = `Basic ${basicAuth}`;
    }

      // Agregar body si es necesario
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, fetchOptions);

      // Remover de peticiones activas
        this.activeRequests.delete(requestKey);

        if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        return response;

    } catch (error) {
      // Remover de peticiones activas
        this.activeRequests.delete(requestKey);  
    if (error.name === 'AbortError') {
        console.log(`Petición cancelada: ${requestKey}`);
        return null;
    }
        throw error;
    }
}

  // Hacer petición con streaming
async makeStreamingRequest(url, options = {}) {
    const response = await this.makeRequest(url, {
        ...options,
        method: 'POST'
    });

    if (!response) return null;

    return {
        response,
        reader: response.body.getReader(),
        decoder: new TextDecoder()
    };
}

  // Obtener estado de peticiones activas
getActiveRequestsCount() {
    return this.activeRequests.size;
}

  // Verificar si una petición específica está activa
isRequestActive(url, method = 'GET', data = null) {
    const key = this.generateRequestKey(url, method, data);
    return this.activeRequests.has(key);
}
}

// Singleton instance
const requestService = new RequestService();

export default requestService;