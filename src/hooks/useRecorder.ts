import { useState, useRef } from "react";

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      clearInterval(timerRef.current!);
      setRecordingTime(0);
    };

    mediaRecorder.start();
    setIsRecording(true);

    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = (): Blob | null => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return null;

    mediaRecorder.stop();
    setIsRecording(false);
    clearInterval(timerRef.current!);

    if (chunks.current.length > 0) {
      return new Blob(chunks.current, { type: "audio/webm" });
    }
    return null;
  };

  return { isRecording, recordingTime, startRecording, stopRecording };
}

