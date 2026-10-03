// Profile pictures: the built-in default avatar and the resize applied to uploaded photos.

const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#3a3d3d"/>
  <circle cx="50" cy="38" r="16" fill="#7e8380"/>
  <ellipse cx="50" cy="80" rx="28" ry="22" fill="#7e8380"/>
</svg>`;

// The default avatar of earlier versions, still stored in the profiles created with them.
const LEGACY_DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#3a3a4a"/>
  <circle cx="50" cy="38" r="16" fill="#6b6b7b"/>
  <ellipse cx="50" cy="80" rx="28" ry="22" fill="#6b6b7b"/>
</svg>`;

const toDataUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

export const defaultAvatar = toDataUrl(DEFAULT_AVATAR_SVG);
export const LEGACY_DEFAULT_AVATAR = toDataUrl(LEGACY_DEFAULT_AVATAR_SVG);

export const isDefaultAvatar = (avatar: string | null | undefined): boolean =>
  !avatar || avatar === defaultAvatar || avatar === LEGACY_DEFAULT_AVATAR;

// Profiles keep the avatar they were saved with; an old default one (or a stored value that is not
// text at all) is shown as the current default.
export const normalizeAvatar = (avatar: unknown): string =>
  typeof avatar === 'string' && !isDefaultAvatar(avatar) ? avatar : defaultAvatar;

export const MAX_AVATAR_SIZE = 200;
export const AVATAR_QUALITY = 0.8;

// Crops an image file to a centred square and scales it to MAX_AVATAR_SIZE as a JPEG data URL.
export function resizeImage(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // readAsDataURL always produces text.
      if (typeof reader.result !== 'string') {
        reject(new Error('The file could not be read as an image.'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = MAX_AVATAR_SIZE;
        canvas.height = MAX_AVATAR_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('This browser cannot draw the photo.'));
          return;
        }

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_AVATAR_SIZE, MAX_AVATAR_SIZE);
        resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
