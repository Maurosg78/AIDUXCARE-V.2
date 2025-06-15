/**
 * 🏥 PATIENT SERVICE - AIDUXCARE V.2
 * Servicio centralizado para comunicación con el backend de pacientes
 * Implementa el contrato API definido en API_CONTRACT.md
 */

// === CONFIGURACIÓN ===
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-zalv4ryzjq-uc.a.run.app';

// === TIPOS ===
export interface CreatePatientRequest {
  name: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  reasonForConsultation: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  reasonForConsultation: string;
  status: 'active' | 'deleted';
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  deletedAt: {
    _seconds: number;
    _nanoseconds: number;
  } | null;
}

export interface UpdatePatientRequest {
  name?: string;
  email?: string;
  phone?: string | null;
  birthDate?: string | null;
  reasonForConsultation?: string;
}

export interface ApiError {
  error: string;
}

// === UTILIDADES PRIVADAS ===
class PatientApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'PatientApiError';
  }
}

/**
 * Maneja las respuestas de la API y errores
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const hasJsonContent = contentType && contentType.includes('application/json');
  
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    let errorData = null;

    if (hasJsonContent) {
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Si no se puede parsear el JSON de error, usar mensaje por defecto
      }
    }

    throw new PatientApiError(errorMessage, response.status, errorData);
  }

  // Para respuestas 204 (No Content), retornar null
  if (response.status === 204) {
    return null as T;
  }

  if (!hasJsonContent) {
    throw new PatientApiError('Respuesta inválida del servidor', response.status);
  }

  try {
    return await response.json();
  } catch (e) {
    throw new PatientApiError('Error al procesar respuesta del servidor', response.status);
  }
}

/**
 * Realiza petición HTTP con configuración estándar
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    return await handleApiResponse<T>(response);
  } catch (error) {
    if (error instanceof PatientApiError) {
      throw error;
    }
    
    // Error de red o conexión
    throw new PatientApiError(
      'Error de conexión con el servidor. Verifica tu conexión a internet.',
      0
    );
  }
}

// === SERVICIOS PÚBLICOS ===

/**
 * POST /patients - Crear nuevo paciente
 */
export async function createPatient(patientData: CreatePatientRequest): Promise<Patient> {
  console.log('📤 Creando paciente:', patientData);
  
  try {
    const patient = await apiRequest<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
    
    console.log('✅ Paciente creado exitosamente:', patient);
    return patient;
  } catch (error) {
    console.error('❌ Error al crear paciente:', error);
    throw error;
  }
}

/**
 * GET /patients/:id - Obtener paciente por ID
 */
export async function getPatientById(patientId: string): Promise<Patient> {
  console.log('📥 Obteniendo paciente:', patientId);
  
  try {
    const patient = await apiRequest<Patient>(`/patients/${patientId}`);
    
    console.log('✅ Paciente obtenido exitosamente:', patient);
    return patient;
  } catch (error) {
    console.error('❌ Error al obtener paciente:', error);
    throw error;
  }
}

/**
 * PUT /patients/:id - Actualizar paciente existente
 */
export async function updatePatient(
  patientId: string, 
  updateData: UpdatePatientRequest
): Promise<Patient> {
  console.log('📝 Actualizando paciente:', patientId, updateData);
  
  try {
    const patient = await apiRequest<Patient>(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    console.log('✅ Paciente actualizado exitosamente:', patient);
    return patient;
  } catch (error) {
    console.error('❌ Error al actualizar paciente:', error);
    throw error;
  }
}

/**
 * DELETE /patients/:id - Eliminar paciente (soft delete)
 */
export async function deletePatient(patientId: string): Promise<void> {
  console.log('🗑️ Eliminando paciente:', patientId);
  
  try {
    await apiRequest<void>(`/patients/${patientId}`, {
      method: 'DELETE',
    });
    
    console.log('✅ Paciente eliminado exitosamente');
  } catch (error) {
    console.error('❌ Error al eliminar paciente:', error);
    throw error;
  }
}

/**
 * GET /patients - Listar todos los pacientes activos
 */
export async function listPatients(): Promise<Patient[]> {
  console.log('📋 Listando pacientes activos');
  
  try {
    const patients = await apiRequest<Patient[]>('/patients');
    
    console.log('✅ Pacientes obtenidos exitosamente:', patients.length);
    return patients;
  } catch (error) {
    console.error('❌ Error al listar pacientes:', error);
    throw error;
  }
}

/**
 * GET /health - Health check de la API
 */
export async function checkApiHealth(): Promise<{
  status: string;
  timestamp: string;
  service: string;
  version: string;
}> {
  console.log('🔍 Verificando estado de la API');
  
  try {
    const health = await apiRequest<{
      status: string;
      timestamp: string;
      service: string;
      version: string;
    }>('/health');
    
    console.log('✅ API funcionando correctamente:', health);
    return health;
  } catch (error) {
    console.error('❌ Error en health check:', error);
    throw error;
  }
}

// === UTILIDADES DE MANEJO DE ERRORES ===

/**
 * Verifica si un error es de tipo PatientApiError
 */
export function isPatientApiError(error: unknown): error is PatientApiError {
  return error instanceof PatientApiError;
}

/**
 * Obtiene un mensaje de error amigable para mostrar al usuario
 */
export function getErrorMessage(error: unknown): string {
  if (isPatientApiError(error)) {
    switch (error.status) {
      case 400:
        return 'Los datos proporcionados no son válidos. Verifica la información e intenta nuevamente.';
      case 404:
        return 'El paciente solicitado no fue encontrado.';
      case 500:
        return 'Error interno del servidor. Intenta nuevamente en unos momentos.';
      case 0:
        return error.message; // Error de conexión
      default:
        return error.message;
    }
  }
  
  return 'Ha ocurrido un error inesperado. Intenta nuevamente.';
}

// === EXPORTACIONES ===
export { PatientApiError }; 