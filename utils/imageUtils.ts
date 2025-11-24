/**
 * Converts a blob to a Data URL string
 */
export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Creates an Image element from a URL
 * @param url Image source URL
 * @param useCors Whether to set crossOrigin='anonymous'. Default true. 
 *                Set to false for local Blob URLs to avoid "Tainted Canvas" issues.
 */
export const createImage = (url: string, useCors = true): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    if (useCors) {
      image.setAttribute('crossOrigin', 'anonymous'); 
    }
    image.src = url;
  });

/**
 * Formats bytes into human readable string
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Converts PNG to JPG using Canvas
 * Fills transparent background with white (or specified color)
 */
export const convertPngToJpg = async (file: File, quality = 0.9): Promise<string> => {
  const imageUrl = await blobToDataURL(file);
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Fill white background for JPG transparency handling
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Export
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

/**
 * Compresses an image by resizing or reducing quality
 */
export const compressImage = async (file: File, quality = 0.7, scale = 1): Promise<{ url: string; blob: Blob }> => {
  const imageUrl = await blobToDataURL(file);
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const width = img.width * scale;
      const height = img.height * scale;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use generic white background just in case
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              url: URL.createObjectURL(blob),
              blob: blob
            });
          } else {
            reject(new Error('Compression failed'));
          }
        },
        file.type === 'image/png' ? 'image/jpeg' : file.type, // Force jpeg if heavy compression needed, otherwise keep type
        quality
      );
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};
