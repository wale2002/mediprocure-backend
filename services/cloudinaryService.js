const { cloudinary } = require("../config/cloudinary");
const fs = require("fs");

async function uploadImage(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath);
    // Clean up temp file after upload
    fs.unlinkSync(filePath);
    return result.secure_url;
  } catch (error) {
    // Clean up on error too
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
}

module.exports = { uploadImage };
