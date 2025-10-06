import React from 'react';
import { useParams } from 'react-router-dom';
import { useCurrentPatient } from '@/context/CurrentPatientContext';
import NotesErrorBoundary from '@/components/notes/NotesErrorBoundary';
import { SaveNoteButton } from '@/components/notes/SaveNoteButton';
import { isProgressNotesEnabled } from '@/flags';
import type { ReactNode } from 'react';

type Props = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  patientId?: string;
  visitId?: string;
  /** si el contenedor ya conoce el usuario, lo pasa aquí */
  clinicianUid?: string;
  /** slot opcional para cabecera u otros elementos */
  header?: ReactNode;
};

export default function SOAPNotePreview(props: Props) {
  const { currentPatient, currentVisit } = useCurrentPatient();
  const { patientId: paramPid } = useParams<{ patientId: string }>();

  const patientId = props.patientId ?? paramPid ?? currentPatient?.id ?? '';
  const visitId = props.visitId ?? currentVisit?.id ?? '';
  const clinicianUid = props.clinicianUid ?? '';

  return (
    <NotesErrorBoundary>
      <section>
        {props.header ?? null}
        <div>
          <h3>Subjective</h3>
          <p>{props.subjective}</p>
        </div>
        <div>
          <h3>Objective</h3>
          <p>{props.objective}</p>
        </div>
        <div>
          <h3>Assessment</h3>
          <p>{props.assessment}</p>
        </div>
        <div>
          <h3>Plan</h3>
          <p>{props.plan}</p>
        </div>

        {isProgressNotesEnabled() && (
          <SaveNoteButton
            subjective={props.subjective}
            objective={props.objective}
            assessment={props.assessment}
            plan={props.plan}
            patientId={patientId}
            visitId={visitId}
            clinicianUid={clinicianUid}
          />
        )}
      </section>
    </NotesErrorBoundary>
  );
}
