import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  isRecording: boolean;
  analyserNode: AnalyserNode | null;
}

export default function AudioWaveform({ isRecording, analyserNode }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isRecording || !analyserNode || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.fillStyle = "hsl(var(--background))";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Create gradient effect with primary color
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, "hsl(var(--primary))");
        gradient.addColorStop(1, "hsl(var(--primary) / 0.3)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, analyserNode]);

  if (!isRecording) return null;

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-muted/50 rounded-lg border border-primary/20 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
        <span className="text-sm font-medium text-primary">Recording...</span>
      </div>
      <canvas
        ref={canvasRef}
        width={280}
        height={60}
        className="rounded-lg"
      />
      <p className="text-xs text-muted-foreground">Tap microphone to stop</p>
    </div>
  );
}
