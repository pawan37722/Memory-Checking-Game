export const IMAGE_FOLDERS = [
  "1_Oggy_and_Cockroaches",
  "2_Tom_and_Jerry",
  "3_Mickey_Mouse",
  "4_Pakdam_Pakdai",
  "5_Doraemon",
];

export const IMAGES_PER_FOLDER = 10;

export const IMAGES = IMAGE_FOLDERS.flatMap((folder, f) =>
  Array.from({ length: IMAGES_PER_FOLDER }, (_, i) => ({
    name: "",
    url: `/picture/${folder}/img${i + 1}.png`,
    fallbackIndex: f * IMAGES_PER_FOLDER + i,
  }))
);

export function placeholderFor(index) {
  const hue = (index * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${hue},70%,62%)"/><text x="50" y="62" font-size="38" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="white">${index + 1}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
