// routes/orders.js
const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getAvailableOrders,
  getUserOrders,
  acceptOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

const router = express.Router();

// Riders can accept and update orders
router.get("/available", protect, authorize("rider"), getAvailableOrders);
router.get("/user", protect, getUserOrders);
router.put("/:id/accept", protect, authorize("rider"), acceptOrder);
router.put("/:id/status", protect, authorize("rider"), updateOrderStatus);

module.exports = router;
