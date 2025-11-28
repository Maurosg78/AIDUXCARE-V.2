export type AiDuxVoiceIntent =
  | "start_live"
  | "start_dictation"
  | "stop_transcription"
  | "summarize_for_record"
  | "ask_medication_info"
  | "ask_tecartherapy_info"
  | "ask_medication_effect"
  | "ask_tecar_parameters"
  | "ask_modality_info"
  | "ask_exercise_prescription_safety"
  | "ask_flag_criteria"
  | "ask_range_of_motion_norms"
  | "unknown";

export interface AiDuxVoiceCommandPayload {
  medicationName?: string;
  conditionOrRegion?: string;
  modalityName?: string;
  bodyRegion?: string;
  language?: "en" | "es" | "fr";
}

export interface AiDuxVoiceCommand {
  intent: AiDuxVoiceIntent;
  rawText: string;
  payload?: AiDuxVoiceCommandPayload;
}
