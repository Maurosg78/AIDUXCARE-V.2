import { CanadianPromptFactory } from "./PromptFactory-Canada";
import type { ProfessionalProfile } from "@/context/ProfessionalProfileContext";

export const PromptFactory = {
  create: (params: {
    contextoPaciente: string;
    instrucciones?: string;
    transcript: string;
    especialidad?: string;
    professionalProfile?: ProfessionalProfile | null;
  }) => {
    return CanadianPromptFactory.create({
      contextoPaciente: params.contextoPaciente,
      transcript: params.transcript,
      instrucciones: params.instrucciones,
      professionalProfile: params.professionalProfile,
    });
  },
};
