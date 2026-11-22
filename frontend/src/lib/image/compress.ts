/**
 * Compression d'une photo sur le téléphone avant l'envoi (spec 12.1 : 1 600 px au plus, JPEG 0,8) :
 * réseau souvent faible, et les métadonnées (position GPS de l'appareil…) disparaissent au passage.
 */
export interface CompressedPhoto { dataUrl: string; width: number; height: number; sizeKb: number; name: string }

export async function compressImage(file: File, max = 1600, quality = 0.8): Promise<CompressedPhoto> {
  if (!file.type.startsWith('image/')) throw new Error('Ce fichier n’est pas une photo.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Photo illisible.'));
      i.src = url;
    });
    const ratio = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * ratio);
    const height = Math.round(img.naturalHeight * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return { dataUrl, width, height, sizeKb: Math.round((dataUrl.length * 3) / 4 / 1024), name: file.name.replace(/\.[^.]+$/, '') + '.jpg' };
  } finally {
    URL.revokeObjectURL(url);
  }
}
