// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const requestRoutes = require("./routes/requests");
const orderRoutes = require("./routes/orders");

// Custom AppError class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    Error.captureStackTrace(this, this.constructor);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://fifthlab-collaboration.onrender.com",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:5000",
  "http://localhost:2213",
  "https://pharma-route.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(
        new AppError(`CORS policy: Origin ${origin} not allowed`, 403),
        false
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/orders", orderRoutes);

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Something went wrong!" });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
