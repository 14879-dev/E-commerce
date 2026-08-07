/**
 * Utility for automatic background removal from product images.
 * Uses Canvas pixel color thresholding & edge alpha matting to isolate foreground objects.
 */

export async function removeImageBackground(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample background color from corner pixels (top-left, top-right, bottom-left, bottom-right)
      const corners = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1]
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      corners.forEach(([x, y]) => {
        const idx = (y * canvas.width + x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR /= corners.length;
      bgG /= corners.length;
      bgB /= corners.length;

      // Distance threshold for background removal
      const threshold = 45;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance from background color
        const dist = Math.sqrt(
          (r - bgR) * (r - bgR) +
          (g - bgG) * (g - bgG) +
          (b - bgB) * (b - bgB)
        );

        // Also check if pixel is near-white or light studio grey
        const isNearWhite = r > 235 && g > 235 && b > 235;

        if (dist < threshold || isNearWhite) {
          // Feather edges near threshold
          if (dist >= threshold - 15 && !isNearWhite) {
            const alpha = Math.floor(((dist - (threshold - 15)) / 15) * 255);
            data[i + 3] = Math.min(data[i + 3], alpha);
          } else {
            data[i + 3] = 0; // Fully transparent
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve(imageSrc); // Return original if error
    };

    img.src = imageSrc;
  });
}
