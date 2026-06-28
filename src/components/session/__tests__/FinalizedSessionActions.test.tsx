import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FinalizedSessionActions,
  type FinalizedSessionActionsProps,
} from '../FinalizedSessionActions';

const buttonNamePatterns = {
  copy: /copiar al portapapeles/i,
  downloadTxt: /descargar \.txt/i,
  exportPdf: /exportar pdf/i,
  commandCenter: /volver al centro de mando/i,
  sendEmail: /enviar resumen al paciente/i,
  certificate: /certificado/i,
  referralReport: /informe/i,
} as const;

const buildProps = (
  overrides: Partial<FinalizedSessionActionsProps> = {},
): FinalizedSessionActionsProps => ({
  soapNote: {
    subjective: 'Paciente refiere mejoría',
    objective: 'ROM extensión 60° a 65°',
    assessment: 'Progreso favorable',
    plan: 'TRATAMIENTO EN CLÍNICA:\n- Movilización articular\nprograma de ejercicios en casa:\n- Mantener ROM asistido',
  },
  sessionId: 'session-test-001',
  sessionDateKey: '2026-06-28',
  patientName: 'Test Patient',
  patientEmail: 'patient@test.com',
  professionalName: 'Dr. Test',
  professionalLicense: 'COL-12345',
  canEmail: true,
  canCertificate: true,
  canReferralReport: true,
  onCopy: vi.fn(),
  onDownloadTxt: vi.fn(),
  onExportPdf: vi.fn(),
  onSendEmail: vi.fn(),
  onCertificate: vi.fn(),
  onReferralReport: vi.fn(),
  onBackToCommandCenter: vi.fn(),
  emailSent: false,
  ...overrides,
});

const renderActions = (
  overrides: Partial<FinalizedSessionActionsProps> = {},
): FinalizedSessionActionsProps => {
  const props = buildProps(overrides);
  render(<FinalizedSessionActions {...props} />);
  return props;
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('FinalizedSessionActions — Renderizado de acciones base', () => {
  it('garantiza que la sesión finalizada siempre puede copiarse al portapapeles', () => {
    renderActions();

    expect(screen.getByRole('button', { name: buttonNamePatterns.copy })).toBeInTheDocument();
  });

  it('garantiza que la sesión finalizada siempre puede descargarse como texto clínico', () => {
    renderActions();

    expect(screen.getByRole('button', { name: buttonNamePatterns.downloadTxt })).toBeInTheDocument();
  });

  it('garantiza que la sesión finalizada siempre puede exportarse a PDF', () => {
    renderActions();

    expect(screen.getByRole('button', { name: buttonNamePatterns.exportPdf })).toBeInTheDocument();
  });

  it('garantiza que el profesional siempre puede volver al Centro de mando', () => {
    renderActions();

    expect(screen.getByRole('button', { name: buttonNamePatterns.commandCenter })).toBeInTheDocument();
  });

  it('mantiene las acciones clínicas en un orden fijo y predecible', () => {
    renderActions();

    const actionNames = screen.getAllByRole('button').map((button) => button.textContent?.trim());

    expect(actionNames).toEqual([
      'Copiar al portapapeles',
      'Descargar .txt',
      'Exportar PDF',
      'Enviar resumen al paciente',
      'Certificado',
      'Informe',
      'Volver al Centro de mando',
    ]);
  });
});

describe('FinalizedSessionActions — Acción de envío de resumen al paciente', () => {
  it('protege al paciente ocultando el envío de resumen cuando la capacidad de email está desactivada', () => {
    renderActions({ canEmail: false });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.sendEmail })).not.toBeInTheDocument();
  });

  it('protege al paciente ocultando el envío de resumen cuando no hay email registrado', () => {
    renderActions({ patientEmail: undefined });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.sendEmail })).not.toBeInTheDocument();
  });

  it('protege al paciente ocultando el envío de resumen cuando el email registrado está vacío', () => {
    renderActions({ patientEmail: '   ' });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.sendEmail })).not.toBeInTheDocument();
  });

  it('evita enviar un resumen sin contenido clínico derivable desde el SOAP finalizado', () => {
    renderActions({
      soapNote: {
        subjective: 'Paciente refiere mejoría',
        objective: 'ROM extensión 60° a 65°',
        assessment: 'Progreso favorable',
        plan: '',
      },
    });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.sendEmail })).not.toBeInTheDocument();
  });

  it('permite enviar resumen cuando existe email válido y contenido derivable desde el plan SOAP', () => {
    renderActions();

    expect(screen.getByRole('button', { name: buttonNamePatterns.sendEmail })).toBeInTheDocument();
  });

  it('muestra confirmación clínica cuando el resumen ya fue enviado al paciente', () => {
    renderActions({ emailSent: true });

    expect(screen.getByText('Resumen enviado al paciente')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: buttonNamePatterns.sendEmail })).not.toBeInTheDocument();
  });

  it('mantiene disponible el botón de envío cuando el resumen aún no fue enviado', () => {
    renderActions({ emailSent: false });

    expect(screen.getByRole('button', { name: buttonNamePatterns.sendEmail })).toBeEnabled();
  });

  it('ejecuta una sola solicitud de envío de resumen al paciente por click clínico', () => {
    const props = renderActions();

    fireEvent.click(screen.getByRole('button', { name: buttonNamePatterns.sendEmail }));

    expect(props.onSendEmail).toHaveBeenCalledTimes(1);
    expect(props.onSendEmail).toHaveBeenCalledWith();
  });
});

describe('FinalizedSessionActions — Acción de certificado', () => {
  it('oculta Certificado cuando la jurisdicción o capacidad profesional no lo permite', () => {
    renderActions({ canCertificate: false });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.certificate })).not.toBeInTheDocument();
  });

  it('oculta Certificado cuando no existe callback autorizado para generar el documento', () => {
    renderActions({ onCertificate: undefined });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.certificate })).not.toBeInTheDocument();
  });

  it('muestra Certificado cuando la capacidad está activa y existe callback autorizado', () => {
    renderActions({ canCertificate: true, onCertificate: vi.fn() });

    expect(screen.getByRole('button', { name: buttonNamePatterns.certificate })).toBeInTheDocument();
  });

  it('ejecuta la acción de certificado una sola vez por click profesional', () => {
    const onCertificate = vi.fn();
    renderActions({ onCertificate });

    fireEvent.click(screen.getByRole('button', { name: buttonNamePatterns.certificate }));

    expect(onCertificate).toHaveBeenCalledTimes(1);
    expect(onCertificate).toHaveBeenCalledWith();
  });
});

describe('FinalizedSessionActions — Acción de informe de derivación', () => {
  it('oculta Informe cuando la sesión no cumple criterios para derivación', () => {
    renderActions({ canReferralReport: false });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.referralReport })).not.toBeInTheDocument();
  });

  it('oculta Informe cuando no existe callback autorizado para generar derivación', () => {
    renderActions({ onReferralReport: undefined });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.referralReport })).not.toBeInTheDocument();
  });

  it('muestra Informe cuando la sesión cumple criterios y existe callback autorizado', () => {
    renderActions({ canReferralReport: true, onReferralReport: vi.fn() });

    expect(screen.getByRole('button', { name: buttonNamePatterns.referralReport })).toBeInTheDocument();
  });

  it('ejecuta la acción de informe de derivación una sola vez por click profesional', () => {
    const onReferralReport = vi.fn();
    renderActions({ onReferralReport });

    fireEvent.click(screen.getByRole('button', { name: buttonNamePatterns.referralReport }));

    expect(onReferralReport).toHaveBeenCalledTimes(1);
    expect(onReferralReport).toHaveBeenCalledWith();
  });
});

describe('FinalizedSessionActions — Privacidad de datos profesionales', () => {
  it('no expone contexto profesional en atributos DOM cuando corre en producción', () => {
    vi.stubEnv('NODE_ENV', 'production');

    renderActions();

    expect(screen.getByRole('region')).not.toHaveAttribute('data-professional-context');
  });

  it('expone contexto profesional con nombre y licencia solo en desarrollo para auditoría local', () => {
    vi.stubEnv('NODE_ENV', 'development');

    renderActions();

    expect(screen.getByRole('region')).toHaveAttribute(
      'data-professional-context',
      'Dr. Test · COL-12345',
    );
  });

  it('omite la licencia del contexto profesional de desarrollo cuando no está registrada', () => {
    vi.stubEnv('NODE_ENV', 'development');

    renderActions({ professionalLicense: undefined });

    expect(screen.getByRole('region')).toHaveAttribute('data-professional-context', 'Dr. Test');
  });
});

describe('FinalizedSessionActions — Callbacks de acciones primarias', () => {
  it('registra una sola acción de copia del SOAP finalizado por click profesional', () => {
    const props = renderActions();

    fireEvent.click(screen.getByRole('button', { name: buttonNamePatterns.copy }));

    expect(props.onCopy).toHaveBeenCalledTimes(1);
    expect(props.onCopy).toHaveBeenCalledWith();
  });

  it('registra una sola descarga de texto clínico por click profesional', () => {
    const props = renderActions();

    fireEvent.click(screen.getByRole('button', { name: buttonNamePatterns.downloadTxt }));

    expect(props.onDownloadTxt).toHaveBeenCalledTimes(1);
    expect(props.onDownloadTxt).toHaveBeenCalledWith();
  });

  it('registra una sola exportación PDF por click profesional', () => {
    const props = renderActions();

    fireEvent.click(screen.getByRole('button', { name: buttonNamePatterns.exportPdf }));

    expect(props.onExportPdf).toHaveBeenCalledTimes(1);
    expect(props.onExportPdf).toHaveBeenCalledWith();
  });

  it('registra una sola navegación de retorno al Centro de mando por click profesional', () => {
    const props = renderActions();

    fireEvent.click(screen.getByRole('button', { name: buttonNamePatterns.commandCenter }));

    expect(props.onBackToCommandCenter).toHaveBeenCalledTimes(1);
    expect(props.onBackToCommandCenter).toHaveBeenCalledWith();
  });
});

describe('FinalizedSessionActions — Derivación de contenido del paciente desde el SOAP', () => {
  it('habilita email cuando el plan SOAP finalizado contiene programa de ejercicios en casa', () => {
    renderActions({
      soapNote: {
        subjective: 'Paciente refiere mejoría',
        objective: 'ROM extensión 60° a 65°',
        assessment: 'Progreso favorable',
        plan: 'PROGRAMA DE EJERCICIOS EN CASA:\n- Mantener ROM asistido',
      },
    });

    expect(screen.getByRole('button', { name: buttonNamePatterns.sendEmail })).toBeInTheDocument();
  });

  it('bloquea email cuando el plan SOAP finalizado no contiene contenido clínico enviable', () => {
    renderActions({
      soapNote: {
        subjective: 'Paciente refiere mejoría',
        objective: 'ROM extensión 60° a 65°',
        assessment: 'Progreso favorable',
        plan: '   ',
      },
    });

    expect(screen.queryByRole('button', { name: buttonNamePatterns.sendEmail })).not.toBeInTheDocument();
  });
});
