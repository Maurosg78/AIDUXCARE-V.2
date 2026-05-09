export enum PatientWorkflowStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  DOCUMENTED_DRAFT = 'documented_draft',
  DOCUMENTED_FINAL = 'documented_final',
  ABANDONED = 'abandoned',
  CANCELLED = 'cancelled',
}

export type PatientWorkflowInput = {
  hasAppointment: boolean;
  appointmentStatus?: 'scheduled' | 'cancelled';
  hasSession: boolean;
  sessionStatus?: string;
  hasEncounter: boolean;
  hasConsultation: boolean;
  soapStatus?: 'draft' | 'finalized' | null;
  encounterClosed?: boolean;
};

export function isSessionActive(input: Pick<PatientWorkflowInput, 'sessionStatus'>): boolean {
  const sessionStatus = input.sessionStatus;
  const isActiveSession =
    sessionStatus === 'in_progress' ||
    sessionStatus === 'recording_in_progress' ||
    sessionStatus === 'interrupted';

  return isActiveSession;
}

export function hasClinicalActivity(
  input: Pick<PatientWorkflowInput, 'hasEncounter' | 'hasConsultation' | 'hasSession'>
): boolean {
  const hasAnyClinicalActivity =
    input.hasEncounter ||
    input.hasConsultation ||
    input.hasSession;

  return hasAnyClinicalActivity;
}

export function isEncounterClosed(
  input: Pick<PatientWorkflowInput, 'hasEncounter' | 'encounterClosed'>
): boolean {
  const hasClosedEncounter =
    input.hasEncounter &&
    input.encounterClosed === true;

  return hasClosedEncounter;
}

export function getPatientStatus(input: PatientWorkflowInput): PatientWorkflowStatus {
  const clinicalActivity = hasClinicalActivity(input);

  if (input.appointmentStatus === 'cancelled' && !clinicalActivity) {
    return PatientWorkflowStatus.CANCELLED;
  }

  if (input.soapStatus === 'finalized') {
    return PatientWorkflowStatus.DOCUMENTED_FINAL;
  }

  if (input.hasEncounter) {
    if (isEncounterClosed(input) && !input.hasConsultation) {
      return PatientWorkflowStatus.DOCUMENTED_FINAL;
    }

    return PatientWorkflowStatus.DOCUMENTED_DRAFT;
  }

  if (input.hasConsultation) {
    return PatientWorkflowStatus.DOCUMENTED_DRAFT;
  }

  if (input.hasSession) {
    const activeSession = isSessionActive(input);

    if (activeSession) {
      return PatientWorkflowStatus.IN_PROGRESS;
    }

    return PatientWorkflowStatus.ABANDONED;
  }

  if (input.hasAppointment) {
    return PatientWorkflowStatus.SCHEDULED;
  }

  return PatientWorkflowStatus.SCHEDULED;
}

export function validatePatientStatusInvariants(
  input: PatientWorkflowInput,
  status: PatientWorkflowStatus
): void {
  const clinicalActivity = hasClinicalActivity(input);

  if (
    status === PatientWorkflowStatus.DOCUMENTED_FINAL &&
    !input.hasEncounter &&
    input.soapStatus !== 'finalized'
  ) {
    console.error('DOCUMENTED_FINAL without encounter or finalized SOAP', {
      status,
      rawData: input,
    });
  }

  if (status === PatientWorkflowStatus.CANCELLED && clinicalActivity) {
    console.error('CANCELLED with clinical activity', {
      status,
      rawData: input,
    });
  }

  if (status === PatientWorkflowStatus.IN_PROGRESS && !input.hasSession) {
    console.warn('IN_PROGRESS with no session', {
      status,
      rawData: input,
    });
  }
}
