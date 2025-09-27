// routes/requests.js
const express = require("express");
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth");
const {
  submitPhotoRequest,
  submitInventoryRequest,
  getPendingRequests,
  getUserRequests,
  confirmRequest,
  rejectRequest,
  downloadPhoto,
  getClinicRequestHistory,
  downloadAllPhotos,
  addItemsToPhotoRequest, // NEW: Import the new controller
} = require("../controllers/requestController");

const router = express.Router();
const upload = multer({ dest: "uploads/" }).array("photos", 5);

// Clinic can submit requests
router.post("/photo", protect, authorize("clinic"), upload, submitPhotoRequest);
router.post("/inventory", protect, authorize("clinic"), submitInventoryRequest);
router.get("/user", protect, authorize("clinic"), getUserRequests);
// Download routes
router.get(
  "/:id/download-photo/:index",
  protect,
  authorize("pharmacy"),
  downloadPhoto
);
router.get(
  "/:id/download-all-photos",
  protect,
  authorize("pharmacy"),
  downloadAllPhotos
);
router.get(
  "/clinic/history",
  protect,
  authorize("clinic"),
  getClinicRequestHistory
);

// Pharmacy can get pending and manage
router.get("/pending", protect, authorize("pharmacy"), getPendingRequests);
router.put("/:id/confirm", protect, authorize("pharmacy"), confirmRequest);
router.put("/:id/reject", protect, authorize("pharmacy"), rejectRequest);

// NEW: Pharmacy can add items to photo requests
router.patch(
  "/:id/add-items",
  protect, // Fixed: Use 'protect' for auth
  authorize("pharmacy"), // Add role authorization
  addItemsToPhotoRequest // Use imported function
);

module.exports = router;
