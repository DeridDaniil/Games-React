// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import {
  AVATAR_QUALITY,
  LEGACY_DEFAULT_AVATAR,
  MAX_AVATAR_SIZE,
  defaultAvatar,
  isDefaultAvatar,
  normalizeAvatar,
  resizeImage,
} from './avatar';

const PHOTO = 'data:image/jpeg;base64,AAAA';

const svgOf = (dataUrl: string) => decodeURIComponent(dataUrl.replace('data:image/svg+xml,', ''));

describe('default avatar', () => {
  it('is an SVG data URL in the neutral charcoal palette', () => {
    expect(defaultAvatar.startsWith('data:image/svg+xml,')).toBe(true);
    expect(svgOf(defaultAvatar)).toContain('#3a3d3d');
    expect(svgOf(defaultAvatar)).not.toMatch(/#3a3a4a|#6b6b7b/);
  });

  it('still recognises the cold blue-grey default avatar of older profiles', () => {
    expect(svgOf(LEGACY_DEFAULT_AVATAR)).toContain('#3a3a4a');
    expect(isDefaultAvatar(LEGACY_DEFAULT_AVATAR)).toBe(true);
  });

  it('treats a missing avatar as the default one and a photo as a photo', () => {
    expect(isDefaultAvatar(defaultAvatar)).toBe(true);
    expect(isDefaultAvatar(undefined)).toBe(true);
    expect(isDefaultAvatar('')).toBe(true);
    expect(isDefaultAvatar(PHOTO)).toBe(false);
  });

  it('normalizes old and missing avatars to the current default and keeps photos', () => {
    expect(normalizeAvatar(LEGACY_DEFAULT_AVATAR)).toBe(defaultAvatar);
    expect(normalizeAvatar(undefined)).toBe(defaultAvatar);
    expect(normalizeAvatar(defaultAvatar)).toBe(defaultAvatar);
    expect(normalizeAvatar(PHOTO)).toBe(PHOTO);
  });
});

describe('resizeImage', () => {
  // jsdom can neither decode images nor draw on a canvas, so both are stand-ins that record what they get.
  interface FakeImage {
    source: string;
    width: number;
    height: number;
    onload: (() => void) | null;
    onerror: ((event: Event) => void) | null;
    src: string;
  }

  let image: FakeImage | undefined;
  let canvases: HTMLCanvasElement[];
  let drawImage: Mock<CanvasRenderingContext2D['drawImage']>;

  // `new Image()` returns the object the stand-in constructor returns.
  const stubImage = ({ width, height, broken = false }: { width: number; height: number; broken?: boolean }) => {
    vi.stubGlobal('Image', function FakeImageConstructor() {
      const fake: FakeImage = {
        source: '',
        width: 0,
        height: 0,
        onload: null,
        onerror: null,
        get src() {
          return fake.source;
        },
        set src(value) {
          fake.source = value;
          setTimeout(() => {
            if (broken) {
              fake.onerror?.(new Event('error'));
              return;
            }
            fake.width = width;
            fake.height = height;
            fake.onload?.();
          });
        },
      };
      image = fake;
      return fake;
    });
  };

  const photoFile = () => new File([new Uint8Array([137, 80, 78, 71])], 'photo.png', { type: 'image/png' });

  beforeEach(() => {
    image = undefined;
    canvases = [];
    drawImage = vi.fn<CanvasRenderingContext2D['drawImage']>();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext(this: HTMLCanvasElement) {
      canvases.push(this);
      // Only drawImage is used, and jsdom has no real 2D context to build on.
      return { drawImage } as unknown as CanvasRenderingContext2D;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,RESIZED');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps the 200 px size and the 0.8 JPEG quality', () => {
    expect(MAX_AVATAR_SIZE).toBe(200);
    expect(AVATAR_QUALITY).toBe(0.8);
  });

  it('reads the file as a data URL and returns the canvas as a JPEG at that quality', async () => {
    stubImage({ width: 200, height: 200 });

    const result = await resizeImage(photoFile());

    expect(image?.source.startsWith('data:image/png;base64,')).toBe(true);
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
    expect(result).toBe('data:image/jpeg;base64,RESIZED');
  });

  it('crops a landscape photo to its centred square and scales it to 200 × 200', async () => {
    stubImage({ width: 400, height: 300 });

    await resizeImage(photoFile());

    expect(canvases).toHaveLength(1);
    expect(canvases[0].width).toBe(200);
    expect(canvases[0].height).toBe(200);
    expect(drawImage).toHaveBeenCalledWith(image, 50, 0, 300, 300, 0, 0, 200, 200);
  });

  it('crops a portrait photo to its centred square', async () => {
    stubImage({ width: 300, height: 500 });

    await resizeImage(photoFile());

    expect(drawImage).toHaveBeenCalledWith(image, 0, 100, 300, 300, 0, 0, 200, 200);
  });

  it('rejects a file that cannot be decoded as an image', async () => {
    stubImage({ width: 0, height: 0, broken: true });

    await expect(resizeImage(photoFile())).rejects.toBeInstanceOf(Event);
    expect(drawImage).not.toHaveBeenCalled();
  });

  // Without a 2D context the photo can never be drawn; the edit form must hear about it instead of
  // waiting for a result forever.
  it('rejects when the canvas has no 2D context', async () => {
    stubImage({ width: 200, height: 200 });
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    await expect(resizeImage(photoFile())).rejects.toBeInstanceOf(Error);
    expect(drawImage).not.toHaveBeenCalled();
  });
});
