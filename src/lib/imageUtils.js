export function loadImageSize(src, maxW = 200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, maxW / img.naturalWidth);
      resolve({
        width: Math.round(img.naturalWidth * scale),
        height: Math.round(img.naturalHeight * scale),
      });
    };
    img.onerror = () => resolve({ width: 200, height: 150 });
    img.src = src;
  });
}

export async function removeImageBackground(src) {
  const { removeBackground } = await import(
    "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/+esm"
  );
  const blob = await removeBackground(src);
  return URL.createObjectURL(blob);
}
