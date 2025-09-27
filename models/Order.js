// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DrugRequest",
    required: true,
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      productName: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "assigned", "picked_up", "in_transit", "delivered"],
    default: "pending",
  },
  estimatedDeliveryTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
