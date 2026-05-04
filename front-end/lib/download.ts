import type { AxiosResponse } from 'axios';

/**
 * Fuerza la descarga de una respuesta blob respetando el nombre enviado por el backend.
 */
export function downloadBlobResponse(
  response: AxiosResponse<Blob>,
  fallbackFilename: string,
) {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([response.data], { type: response.data.type || 'application/octet-stream' });
  const objectUrl = window.URL.createObjectURL(blob);
  const contentDisposition = response.headers['content-disposition'];
  const matchedFilename = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)"?/i)?.[1];
  const filename = decodeURIComponent((matchedFilename || fallbackFilename).trim());
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
