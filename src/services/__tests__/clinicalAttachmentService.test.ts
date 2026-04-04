import { describe, expect, it } from 'vitest';
import { inferMimeFromName } from '../clinicalAttachmentService';

describe('inferMimeFromName', () => {
  it('infers common image mime types when browser file.type is empty', () => {
    const jpgMime = inferMimeFromName('radiografia.jpg');
    const jpegMime = inferMimeFromName('radiografia.JPEG');
    const pngMime = inferMimeFromName('captura_rx.png');
    const webpMime = inferMimeFromName('foto.webp');
    const heicMime = inferMimeFromName('imagen.heic');
    const heifMime = inferMimeFromName('imagen.heif');

    expect(jpgMime).toBe('image/jpeg');
    expect(jpegMime).toBe('image/jpeg');
    expect(pngMime).toBe('image/png');
    expect(webpMime).toBe('image/webp');
    expect(heicMime).toBe('image/heic');
    expect(heifMime).toBe('image/heif');
  });

  it('returns null for unknown extensions', () => {
    const unknownMime = inferMimeFromName('archivo.xyz');

    expect(unknownMime).toBeNull();
  });
});
