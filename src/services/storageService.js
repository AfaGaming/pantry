// ─────────────────────────────────────────────────────────────────────────────
// CLOUDINARY IMAGE UPLOAD
// Fill in your Cloud name and upload preset below.
// API Secret is NOT needed here — unsigned uploads only.
// ─────────────────────────────────────────────────────────────────────────────

const CLOUD_NAME   = "dno6whqqv";
const UPLOAD_PRESET = "family_inventory_management_uploads"; // must match what you created in Cloudinary

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

export const uploadItemImage = async (file) => {
  const compressed = await compressImage(file);
  const formData   = new FormData();
  formData.append("file",         compressed);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body:   formData,
  });

  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url; // this is the permanent URL saved to Firestore
};

export const deleteItemImage = async (imageUrl) => {
  // Deletion from the client side requires your API secret which
  // should never be exposed in frontend code.
  // For now images are orphaned on delete — clean them up
  // manually in the Cloudinary dashboard, or implement a
  // Firebase Cloud Function to handle deletion server-side later.
  console.warn("Image deletion skipped — handle via Cloud Function in production.");
};