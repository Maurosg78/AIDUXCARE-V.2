/**
 * 📋 PATIENT DATA PAGE - AIDUXCARE V.2
 * Página de captura de datos del paciente usando el sistema de diseño
 * Modo DEMO con datos mock para la Fase 0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createPatient, 
  getErrorMessage,
  type CreatePatientRequest 
} from '@/core/services/patientService';
import { 
  Heading, 
  BodyText, 
  SmallText
} from '@/shared/components/UI/Typography';
import { 
  CTAPrimaryButton,
  HeaderButton
} from '@/shared/components/UI/Button';
import { 
  Card,
  CardContent,
  CardHeader
} from '@/shared/components/UI/Card';
import { CardTitle } from '@/shared/components/UI/Typography';
import { 
  Icon,
  NavIcon
} from '@/shared/components/UI/Icon';
import { Input } from '@/shared/components/UI/Input';
import { Textarea } from '@/shared/components/UI/Textarea';

// === TIPOS ===
interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  reasonForConsultation: string;
}

const PatientDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    reasonForConsultation: '',
  });

  // === HANDLERS ===
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Validación básica
    if (!formData.name || !formData.email || !formData.reasonForConsultation) {
      setError('Por favor, completa todos los campos obligatorios');
      setLoading(false);
      return;
    }

    try {
      // Preparar datos para el backend según el contrato API
      const patientData: CreatePatientRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? formData.phone.trim() : null,
        birthDate: formData.birthDate || null,
        reasonForConsultation: formData.reasonForConsultation.trim(),
    };

      console.log('🔄 Enviando datos al backend:', patientData);

      // Llamar al servicio real para crear el paciente
      const createdPatient = await createPatient(patientData);
      
      console.log('✅ Paciente creado exitosamente:', createdPatient);

      // Navegar a la lista de pacientes para ver el paciente recién creado
      navigate('/patients');
      
    } catch (error) {
      console.error('❌ Error al crear paciente:', error);
      
      // Usar el servicio de manejo de errores para mostrar mensaje amigable
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPatients = () => {
    navigate('/patients');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Simple */}
      <header className="bg-white shadow-sm border-b border-neutral/20">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo y Título */}
            <div className="flex items-center space-x-6">
              <div 
                className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center"
              >
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <Heading level="h2" size="2xl" className="text-primary mb-1">
                  Nuevo Paciente
                </Heading>
                <BodyText className="text-neutral/70">
                  Información básica para iniciar la atención
                </BodyText>
              </div>
            </div>

            {/* Navegación */}
            <HeaderButton 
              onClick={handleBackToPatients}
              className="flex items-center space-x-2"
            >
              <NavIcon name="arrow-left" />
              <span>Lista de Pacientes</span>
            </HeaderButton>
          </div>
        </div>
      </header>

      {/* Formulario Principal */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        <Card variant="default" size="lg" fullWidth>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Icon name="user" size="lg" color="primary" />
              <span>Datos del Paciente</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {/* Mensaje de Error */}
            {error && (
              <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Icon name="warning" size="md" color="accent" />
                  <BodyText className="text-accent font-medium">
          {error}
                  </BodyText>
                </div>
        </div>
      )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grid de Campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-primary">
                    Nombre Completo *
          </label>
                  <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
                    placeholder="Ej: Andrea González"
                    className="w-full"
          />
        </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-primary">
                    Email *
          </label>
                  <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
                    placeholder="andrea.gonzalez@email.com"
                    className="w-full"
          />
        </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-primary">
            Teléfono
          </label>
                  <Input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
                    placeholder="Ej: +56 9 8765 4321"
                    className="w-full"
                  />
        </div>

                {/* Fecha de Nacimiento */}
                <div className="space-y-2">
                  <label htmlFor="birthDate" className="block text-sm font-medium text-primary">
            Fecha de Nacimiento
          </label>
                  <Input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
                    className="w-full"
          />
                </div>
        </div>

              {/* Motivo de Consulta */}
              <div className="space-y-2">
                <label htmlFor="reasonForConsultation" className="block text-sm font-medium text-primary">
                  Motivo de Consulta *
          </label>
                <Textarea
            id="reasonForConsultation"
            name="reasonForConsultation"
            value={formData.reasonForConsultation}
            onChange={handleInputChange}
            required
                  placeholder="Describe el motivo principal de la consulta..."
            rows={4}
                  className="w-full"
          />
        </div>

              {/* Nota Informativa */}
              <div className="bg-success/10 p-4 rounded-xl border border-success/20">
                <div className="flex items-start space-x-3">
                  <Icon name="check" size="md" color="success" />
        <div>
                    <SmallText className="text-success font-medium">
                      Sistema en Vivo
                    </SmallText>
                    <SmallText className="text-neutral/70 mt-1">
                      Los datos se guardarán en la base de datos y estarán disponibles para futuras consultas.
                    </SmallText>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <CTAPrimaryButton
            type="submit"
            disabled={loading}
                  size="lg"
                  className="flex-1 flex items-center justify-center space-x-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" size="md" color="white" />
                      <span>Crear Paciente y Continuar</span>
                    </>
                  )}
                </CTAPrimaryButton>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Información Adicional */}
        <div className="mt-8 text-center">
          <SmallText className="text-neutral/60">
            Los campos marcados con * son obligatorios
          </SmallText>
        </div>
      </main>
    </div>
  );
};

export default PatientDataPage; 