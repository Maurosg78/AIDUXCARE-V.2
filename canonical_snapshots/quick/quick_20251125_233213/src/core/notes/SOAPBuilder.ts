export type SOAPNote = { subjective:string; objective:string; assessment:string; plan:string };
export type MinimalSOAPNote = SOAPNote & { sections?: any; locale?: string };
export type ChecklistSignal = { id:string; label:string; checked:boolean; speaker?: string; text?: string };

export const SOAPBuilder = {
  fromTranscript(_t:string): SOAPNote {
    return { subjective:'', objective:'', assessment:'', plan:'' };
  },
  fromChecklist(_signals: ChecklistSignal[]): MinimalSOAPNote {
    return { subjective:'', objective:'', assessment:'', plan:'' };
  },
  build(_data:any): MinimalSOAPNote {
    return { subjective:'', objective:'', assessment:'', plan:'' };
  },
};
export default SOAPBuilder;
