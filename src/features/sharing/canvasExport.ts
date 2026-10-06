import { buildStandaloneSvgString, type ExportSvgParams } from '../../core/canvasSvg';

export async function exportTimetableToPng(params: ExportSvgParams): Promise<Blob> {
  const svgString = buildStandaloneSvgString(params);
  const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = img.naturalHeight || img.height || 750;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not obtain canvas 2D context');
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            reject(new Error('Canvas rasterization failed'));
            return;
          }
          resolve(pngBlob);
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG for canvas export'));
    };

    img.src = svgDataUri;
  });
}
