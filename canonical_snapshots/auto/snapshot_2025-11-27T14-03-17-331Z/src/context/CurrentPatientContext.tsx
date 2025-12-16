import { createContext, useContext } from 'react';

export type CurrentPatient = { id: string };
export type CurrentVisit = { id: string } | null;

export type CurrentPatientContextValue = {
  currentPatient: CurrentPatient | null;
  currentVisit: CurrentVisit;
};

const CurrentPatientContext = createContext<CurrentPatientContextValue>({
  currentPatient: null,
  currentVisit: null,
});

export const CurrentPatientProvider = CurrentPatientContext.Provider;

export function useCurrentPatient(): CurrentPatientContextValue {
  return useContext(CurrentPatientContext);
}

export default CurrentPatientContext;
