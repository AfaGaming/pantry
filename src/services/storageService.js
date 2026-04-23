import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../config/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE UPLOAD
// Compresses image client-side before uploading to Firebase Storage.
// Returns the public download URL.
// ─────────────────────────────────────────────────────────────────────────────

const compressImage = (file, maxWidthPx = 800, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidthPx / img.width);
      const canvas = document.createElement("canvas");
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob ? resolve(blob) : reject(new Error("Compression failed"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const uploadItemImage = async (file, itemId) => {
  const compressed = await compressImage(file);
  const storageRef  = ref(storage, `items/${itemId}_${Date.now()}.jpg`);
  const snapshot    = await uploadBytes(storageRef, compressed);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
};

export const deleteItemImage = async (imageUrl) => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch {
    // Silently ignore — image may have already been deleted
  }
};
