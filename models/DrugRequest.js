// models/DrugRequest.js
const mongoose = require("mongoose");

const drugRequestSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  clinicName: {
    type: String,
    required: true,
  },
  photoUrls: [
    {
      type: String,
      default: [],
    },
  ],
  // Remove or keep photoUrl for backward compat if needed
  type: {
    type: String,
    enum: ["photo", "inventory"],
    required: true,
  },
  photoUrl: {
    type: String,
  },
  selectedProducts: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        min: 1,
      },
      productName: {
        type: String,
      },
    },
  ],
  deliveryAddress: {
    type: String,
    required: true,
  },
  patientInfo: {
    type: String,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "rejected",
      "assigned",
      "picked_up",
      "in_transit",
      "delivered",
    ],
    default: "pending",
  },
  rejectionReason: {
    type: String,
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
// In models/DrugRequest.js, after schema definition
// drugRequestSchema.pre("save", function (next) {
//   if (
//     this.status === "confirmed" &&
//     (!this.selectedProducts || this.selectedProducts.length === 0)
//   ) {
//     return next(new Error("Cannot confirm without selected products"));
//   }
//   this.updatedAt = new Date();
//   next();
// });

module.exports = mongoose.model("DrugRequest", drugRequestSchema);
