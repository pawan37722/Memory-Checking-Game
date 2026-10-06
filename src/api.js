const TOKEN_KEY = "memory_card_token";
const USER_KEY = "memory_card_user";

export const MAX_AVATAR_BYTES = 50 * 1024 * 1024;

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null") || {};
  } catch {
    return {};
  }
}
export const setStoredUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const clearStoredUser = () => localStorage.removeItem(USER_KEY);

export async function api(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export function resizeImageFile(file, maxDim = 640, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height >= width && height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read that image."));
    };
    img.src = objectUrl;
  });
}

export async function prepareAvatar(file) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error(`That image is ${(file.size / (1024 * 1024)).toFixed(1)}MB — the limit is 50MB.`);
  }
  return resizeImageFile(file);
}
