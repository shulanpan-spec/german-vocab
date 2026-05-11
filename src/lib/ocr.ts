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

export async function recognize(file: File, onProgress?: ProgressFn): Promise<string> {
  const worker = await getOcrWorker(onProgress);
  const url = URL.createObjectURL(file);
  try {
    const { data } = await worker.recognize(url);
    return data.text;
  } finally {
    URL.revokeObjectURL(url);
  }
}
