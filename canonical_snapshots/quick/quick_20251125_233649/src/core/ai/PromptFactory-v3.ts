import { CanadianPromptFactory } from "./PromptFactory-Canada";

export const PromptFactory = {
  create: (params: {
    contextoPaciente: string;
    instrucciones?: string;
    transcript: string;
    especialidad?: string;
  }) => {
    return CanadianPromptFactory.create({
      contextoPaciente: params.contextoPaciente,
      transcript: params.transcript,
      instrucciones: params.instrucciones,
    });
  },
};
