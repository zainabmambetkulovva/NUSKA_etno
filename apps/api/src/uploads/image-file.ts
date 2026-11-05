/** Allowed image types, detected from the file content (magic bytes), not from the client's MIME header. */
const SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    ext: 'png',
    test: (b) =>
      b.length > 8 &&
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) =>
      b.length > 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
];

/** 4 MB: requests pass through a Vercel function, whose body limit is 4.5 MB. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function detectImageType(buffer: Buffer): { mime: string; ext: string } | null {
  const match = SIGNATURES.find((signature) => signature.test(buffer));
  return match ? { mime: match.mime, ext: match.ext } : null;
}
