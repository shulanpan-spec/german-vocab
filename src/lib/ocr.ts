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
      // German-only: Chinese handwritten notes in the textbook would corrupt
      // the German lines if chi_sim were enabled. The downstream LLM provides
      // Chinese translations from the German lemma anyway.
      const w = await Tesseract.createWorker(['deu'], 1, {
        logger: (m: { status: string; progress: number }) => {
          if (!onProgress) return;
          const label = m.status === 'recognizing text'
            ? '识别中'
            : m.status === 'loading language traineddata'
            ? '下载德语模型 (首次约 10MB)'
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
  options: { columns?: 1 | 2; cropAnnotations?: boolean } = {},
): Promise<string> {
  const worker = await getOcrWorker(onProgress);
  const url = URL.createObjectURL(file);
  const crop = options.cropAnnotations ?? false;
  try {
    if (options.columns === 2) {
      let [leftUrl, rightUrl] = await splitImageVertically(url);
      if (crop) {
        const newLeft = await cropToLeftFraction(leftUrl, 0.62);
        const newRight = await cropToLeftFraction(rightUrl, 0.62);
        URL.revokeObjectURL(leftUrl);
        URL.revokeObjectURL(rightUrl);
        leftUrl = newLeft;
        rightUrl = newRight;
      }
      try {
        onProgress?.(crop ? '识别左栏（去手写）' : '识别左栏', 0);
        const left = await worker.recognize(leftUrl);
        onProgress?.(crop ? '识别右栏（去手写）' : '识别右栏', 50);
        const right = await worker.recognize(rightUrl);
        onProgress?.('识别完成', 100);
        return left.data.text.trim() + '\n\n=== 右栏 ===\n\n' + right.data.text.trim();
      } finally {
        URL.revokeObjectURL(leftUrl);
        URL.revokeObjectURL(rightUrl);
      }
    }
    if (crop) {
      const cropped = await cropToLeftFraction(url, 0.62);
      try {
        const { data } = await worker.recognize(cropped);
        return data.text;
      } finally {
        URL.revokeObjectURL(cropped);
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
  const overlap = Math.round(w * 0.03);
  const midX = Math.floor(w / 2);
  const leftEnd = Math.min(w, midX + overlap);
  const rightStart = Math.max(0, midX - overlap);
  const left = await cropToUrl(img, 0, 0, leftEnd, h);
  const right = await cropToUrl(img, rightStart, 0, w - rightStart, h);
  return [left, right];
}

async function cropToLeftFraction(url: string, fraction: number): Promise<string> {
  const img = await loadImage(url);
  const w = Math.floor(img.naturalWidth * fraction);
  return cropToUrl(img, 0, 0, w, img.naturalHeight);
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
