import { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  stream?: MediaStream | null;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  stream,
  className = '',
}) => {
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!isActive || !stream) {
      setAudioLevels(new Array(20).fill(0));
      return;
    }

    // Initialize AudioContext and AnalyserNode
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;
    analyserRef.current = analyser;
    audioContextRef.current = audioContext;

    // Animation loop to update waveform (optimized for mobile)
    // Throttle updates on low-end devices
    let lastUpdateTime = 0;
    const updateInterval = 16; // ~60fps, but can be adjusted for low-end devices
    
    const updateWaveform = (currentTime: number) => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      // Throttle updates for better performance
      if (currentTime - lastUpdateTime < updateInterval) {
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
        return;
      }

      lastUpdateTime = currentTime;

      // Bloque 2: TypeScript strictness - getByteFrequencyData acepta Uint8Array en runtime
      analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

      // Normalize and create visual bars (20 bars from frequency data)
      const levels: number[] = [];
      const step = Math.floor(dataArrayRef.current.length / 20);

      for (let i = 0; i < 20; i++) {
        const index = i * step;
        const value = dataArrayRef.current[index] || 0;
        // Normalize to 0-1 range (0-255 -> 0-1)
        levels.push(value / 255);
      }

      setAudioLevels(levels);
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    animationFrameRef.current = requestAnimationFrame(updateWaveform);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      source.disconnect();
    };
  }, [isActive, stream]);

  // If not active, show static bars
  if (!isActive) {
    return (
      <div className={`flex items-center justify-center gap-1 h-12 ${className}`}>
        {new Array(20).fill(0).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-slate-300 rounded-full"
            style={{ height: '4px' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-1 h-12 ${className}`}>
      {audioLevels.map((level, i) => {
        const height = Math.max(4, level * 40); // Min 4px, max 40px
        return (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-sky-500 to-sky-400 rounded-full transition-all duration-75"
            style={{
              height: `${height}px`,
              opacity: level > 0.1 ? 1 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
};

