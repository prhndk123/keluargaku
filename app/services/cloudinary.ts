const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dvuwskn69";
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || "732327885449443";
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || "hUxTJzfL6Qyav9LojvBco7PO1fs";

async function sha1(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractPublicId(url: string): string {
  const withoutQuery = url.split("?")[0];
  const parts = withoutQuery.split("/");
  const uploadIndex = parts.findIndex((p) => p === "upload");
  const publicIdParts = parts.slice(uploadIndex + 2);
  const filename = publicIdParts.join("/");
  return filename.replace(/\.[^/.]+$/, "");
}

export const cloudinaryApi = {
  upload: async (file: File): Promise<string> => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signatureStr = `timestamp=${timestamp}${API_SECRET}`;
    const signature = await sha1(signatureStr);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Gagal mengunggah gambar ke Cloudinary.");
    }

    const data = await res.json();
    return data.secure_url;
  },

  deleteByUrl: async (url: string): Promise<void> => {
    try {
      const publicId = extractPublicId(url);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
      const signature = await sha1(signatureStr);

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("api_key", API_KEY);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Gagal menghapus gambar di Cloudinary:", err.error?.message);
      }
    } catch (e) {
      console.error("Error deleting image from Cloudinary:", e);
    }
  },
};
