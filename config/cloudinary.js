// utils/cloudinary.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath) => {
  try {
    return await cloudinary.uploader.upload(filePath, {
      folder: "medilink",
      resource_type: "auto",
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Image upload failed");
  }
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn("Failed to delete image from Cloudinary:", error.message);
  }
};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\/v\d+\/(.*)\.\w+$/);
  return match ? match[1] : null;
};

module.exports = { uploadImage, deleteImage, getPublicIdFromUrl };
