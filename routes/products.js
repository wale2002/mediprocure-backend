// routes/products.js
const express = require("express");
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth");
const {
  getInventory,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Only pharmacy can manage products
router.use(protect);
router.use(authorize("pharmacy"));

router.get("/", getInventory);
router.post("/", upload.single("image"), addProduct);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
