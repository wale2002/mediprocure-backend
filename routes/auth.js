// routes/auth.js
const express = require("express");
const { register, login, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);

module.exports = router;
