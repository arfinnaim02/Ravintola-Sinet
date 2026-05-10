import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

function getBaseFolder() {
  return process.env.CLOUDINARY_FOLDER || "ravintola-sinet";
}

export async function uploadImageToCloudinary(
  file: File | null,
  folder = "general"
): Promise<string> {
  if (!file || file.size === 0) return "";

  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL is missing.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `${getBaseFolder()}/${folder}`,
          resource_type: "image",
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed."));
            return;
          }

          resolve(result);
        }
      )
      .end(buffer);
  });

  return result.secure_url;
}