import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: any;
}

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
  file: string | Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const uploadOptions: any = {
      folder: options.folder || "pexjet",
      resource_type: "image",
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    if (options.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    // If file is a Buffer, convert to base64 data URI
    let uploadSource: string;
    if (Buffer.isBuffer(file)) {
      uploadSource = `data:image/png;base64,${file.toString("base64")}`;
    } else {
      uploadSource = file;
    }

    const result = await cloudinary.uploader.upload(uploadSource, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload a PDF to Cloudinary
 */
export async function uploadPDF(
  file: string | Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const uploadOptions: any = {
      folder: options.folder || "pexjet/documents",
      resource_type: "raw",
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    let uploadSource: string;
    if (Buffer.isBuffer(file)) {
      uploadSource = `data:application/pdf;base64,${file.toString("base64")}`;
    } else {
      uploadSource = file;
    }

    const result = await cloudinary.uploader.upload(uploadSource, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(
  publicId: string,
  resourceType: "image" | "raw" = "image"
): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return { success: true };
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a signed upload URL for client-side uploads
 */
export function generateUploadSignature(
  folder: string = "pexjet"
): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
} {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET || ""
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
  };
}

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    secure: true,
    width: options.width,
    height: options.height,
    crop: options.crop || "fill",
    quality: options.quality || "auto",
    fetch_format: "auto",
  });
}

/**
 * Upload aircraft image with specific transformations
 */
export async function uploadAircraftImage(
  file: string | Buffer,
  aircraftId: string,
  type: "exterior" | "interior" | "thumbnail"
): Promise<UploadResult> {
  const folder = `pexjet/aircraft/${aircraftId}/${type}`;
  const transformation =
    type === "thumbnail"
      ? { width: 400, height: 300, crop: "fill", quality: "auto" }
      : { width: 1200, height: 800, crop: "limit", quality: "auto" };

  return uploadImage(file, { folder, transformation });
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(
  file: string | Buffer,
  userId: string,
  userType: "admin" | "operator"
): Promise<UploadResult> {
  const folder = `pexjet/avatars/${userType}`;
  const transformation = { width: 200, height: 200, crop: "fill", quality: "auto" };

  return uploadImage(file, {
    folder,
    publicId: userId,
    transformation,
  });
}

export { cloudinary };
