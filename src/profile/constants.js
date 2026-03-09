// Default gray avatar with profile silhouette
const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#3a3a4a"/>
  <circle cx="50" cy="38" r="16" fill="#6b6b7b"/>
  <ellipse cx="50" cy="80" rx="28" ry="22" fill="#6b6b7b"/>
</svg>`;

export const defaultAvatar = `data:image/svg+xml,${encodeURIComponent(defaultSvg)}`;

export const MAX_AVATAR_SIZE = 200;
export const AVATAR_QUALITY = 0.8;

export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = MAX_AVATAR_SIZE;
        canvas.height = MAX_AVATAR_SIZE;
        const ctx = canvas.getContext('2d');

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_AVATAR_SIZE, MAX_AVATAR_SIZE);
        resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
