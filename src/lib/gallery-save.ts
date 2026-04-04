/**
 * Creates a designed species card image and saves it to the device gallery.
 * Falls back to download on browsers without native gallery access.
 */

const KINGDOM_COLORS: Record<string, string> = {
  plant: "#22c55e",
  mammal: "#f59e0b",
  insect: "#92400e",
  bird: "#3b82f6",
  reptile: "#eab308",
  fish: "#0ea5e9",
  amphibian: "#10b981",
  other: "#8b5cf6",
};

export interface SpeciesCardData {
  species_name: string;
  scientific_name?: string | null;
  kingdom: string;
  description?: string | null;
  image_url?: string | null;
  confidence?: number | null;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number): number {
  const words = text.split(" ");
  let line = "";
  let lines = 0;

  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      lines++;
      if (lines > maxLines) break;
      ctx.fillText(line.trim(), x, y);
      y += lineHeight;
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (lines <= maxLines) {
    ctx.fillText(line.trim(), x, y);
    y += lineHeight;
  }
  return y;
}

export async function createSpeciesCardImage(data: SpeciesCardData): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const kingdomColor = KINGDOM_COLORS[data.kingdom] || KINGDOM_COLORS.other;

  // Background
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, W, H);

  // Species image
  const imgAreaH = 750;
  if (data.image_url) {
    try {
      const img = await loadImage(data.image_url);
      const scale = Math.max(W / img.width, imgAreaH / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, (W - sw) / 2, (imgAreaH - sh) / 2, sw, sh);
    } catch {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, W, imgAreaH);
    }
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, imgAreaH);
  }

  // Gradient overlay at bottom of image
  const grad = ctx.createLinearGradient(0, imgAreaH - 200, 0, imgAreaH);
  grad.addColorStop(0, "rgba(15,23,42,0)");
  grad.addColorStop(1, "rgba(15,23,42,1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, imgAreaH - 200, W, 200);

  // Kingdom accent bar
  ctx.fillStyle = kingdomColor;
  ctx.fillRect(60, imgAreaH + 20, 6, 80);

  // Species name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
  ctx.fillText(data.species_name, 84, imgAreaH + 60);

  // Scientific name
  if (data.scientific_name) {
    ctx.fillStyle = kingdomColor;
    ctx.font = "italic 32px Georgia, serif";
    ctx.fillText(data.scientific_name, 84, imgAreaH + 100);
  }

  // Kingdom badge
  const badgeText = data.kingdom.charAt(0).toUpperCase() + data.kingdom.slice(1);
  ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
  const badgeW = ctx.measureText(badgeText).width + 40;
  const badgeX = W - 60 - badgeW;
  const badgeY = imgAreaH + 30;

  ctx.fillStyle = kingdomColor + "33";
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, 40, 20);
  ctx.fill();

  ctx.fillStyle = kingdomColor;
  ctx.fillText(badgeText, badgeX + 20, badgeY + 28);

  // Confidence
  if (data.confidence) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "24px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${data.confidence}% confidence`, 84, imgAreaH + 150);
  }

  // Description
  if (data.description) {
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "26px system-ui, -apple-system, sans-serif";
    wrapText(ctx, data.description, 60, imgAreaH + 200, W - 120, 36, 6);
  }

  // Watermark
  ctx.fillStyle = "#475569";
  ctx.font = "20px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Identified with Specassist", W / 2, H - 30);
  ctx.textAlign = "start";

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92));
}

export async function saveToGallery(data: SpeciesCardData): Promise<boolean> {
  try {
    const blob = await createSpeciesCardImage(data);

    // Try Web Share API for native save (works on mobile)
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], "species.jpg")] })) {
      const file = new File([blob], `${data.species_name.replace(/\s+/g, "_")}.jpg`, {
        type: "image/jpeg",
      });
      await navigator.share({ files: [file] });
      return true;
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.species_name.replace(/\s+/g, "_")}_specassist.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("Failed to save to gallery:", e);
    return false;
  }
}
