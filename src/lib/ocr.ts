type ProgressFn = (label: string, pct: number) => void;

let workerPromise: Promise<{
  recognize: (img: string | File | Blob) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
}> | null = null;

export async function getOcrWorker(onProgress?: ProgressFn) {
  if (!workerPromise) {
    onProgress?.('加载 OCR 引擎', 0);
    const Tesseract = await import('tesseract.js');
    workerPromise = (async () => {
      const w = await Tesseract.createWorker(['deu', 'chi_sim'], 1, {
        logger: (m: { status: string; progress: number }) => {
          if (!onProgress) return;
          const label = m.status === 'recognizing text'
            ? '识别中'
            : m.status === 'loading language traineddata'
            ? '下载语言模型 (首次约 25MB)'
            : m.status;
          onProgress(label, Math.round(m.progress * 100));
        },
      });
      return w as unknown as {
        recognize: (img: string | File | Blob) => Promise<{ data: { text: string } }>;
        terminate: () => Promise<unknown>;
      };
    })();
  }
  return workerPromise;
}

export async function recognize(
  file: File,
  onProgress?: ProgressFn,
  options: { columns?: 1 | 2 } = {},
): Promise<string> {
  const worker = await getOcrWorker(onProgress);
  const url = URL.createObjectURL(file);
  try {
    if (options.columns === 2) {
      const [leftUrl, rightUrl] = await splitImageVertically(url);
      try {
        onProgress?.('识别左栏', 0);
        const left = await worker.recognize(leftUrl);
        onProgress?.('识别右栏', 50);
        const right = await worker.recognize(rightUrl);
        onProgress?.('识别完成', 100);
        return left.data.text.trim() + '\n\n=== 右栏 ===\n\n' + right.data.text.trim();
      } finally {
        URL.revokeObjectURL(leftUrl);
        URL.revokeObjectURL(rightUrl);
      }
    }
    const { data } = await worker.recognize(url);
    return data.text;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function splitImageVertically(url: string): Promise<[string, string]> {
  const img = await loadImage(url);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  // Slight overlap so words on the seam aren't cut
  const overlap = Math.round(w * 0.03);
  const midX = Math.floor(w / 2);
  const leftEnd = Math.min(w, midX + overlap);
  const rightStart = Math.max(0, midX - overlap);
  const left = await cropToUrl(img, 0, 0, leftEnd, h);
  const right = await cropToUrl(img, rightStart, 0, w - rightStart, h);
  return [left, right];
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = (e) => rej(e);
    img.src = url;
  });
}

async function cropToUrl(
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<string> {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  return new Promise((res, rej) => {
    c.toBlob((b) => {
      if (!b) return rej(new Error('canvas toBlob failed'));
      res(URL.createObjectURL(b));
    }, 'image/png');
  });
}
