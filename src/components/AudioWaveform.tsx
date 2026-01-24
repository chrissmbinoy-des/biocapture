import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  isRecording: boolean;
  analyserNode: AnalyserNode | null;
}

// Convert CSS variable HSL format (space-separated) to Canvas-compatible format (comma-separated)
function parseHslVariable(hslValue: string): string {
  // hslValue is like "222.2 47.4% 11.2%"
  const parts = hslValue.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
  }
  // Fallback to a safe color
  return "hsl(142, 76%, 36%)";
}

function parseHslaVariable(hslValue: string, alpha: number): string {
  const parts = hslValue.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `hsla(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
  }
  return `hsla(142, 76%, 36%, ${alpha})`;
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

    // Get computed colors from CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryValue = computedStyle.getPropertyValue("--primary").trim();
    const bgValue = computedStyle.getPropertyValue("--background").trim();

    // Convert to Canvas-compatible colors
    const primaryHsl = parseHslVariable(primaryValue);
    const primaryHslFaded = parseHslaVariable(primaryValue, 0.3);
    const bgHsl = parseHslVariable(bgValue);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.fillStyle = bgHsl;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Create gradient effect with primary color
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, primaryHsl);
        gradient.addColorStop(1, primaryHslFaded);

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
