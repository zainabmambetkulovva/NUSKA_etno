import { detectImageType } from './image-file';

describe('detectImageType', () => {
  it('detects images by content', () => {
    expect(detectImageType(Buffer.from('ffd8ffe000104a464946', 'hex'))?.mime).toBe('image/jpeg');
    expect(detectImageType(Buffer.from('89504e470d0a1a0a0000000d', 'hex'))?.mime).toBe('image/png');
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'binary'))?.mime).toBe('image/webp');
  });

  it('rejects other files even with an image extension', () => {
    expect(
      detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))
    ).toBeNull();
    expect(detectImageType(Buffer.from('%PDF-1.7'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});
