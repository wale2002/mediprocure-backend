// // controllers/authController.js
// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// const { validateEmailDomain } = require("../utils/validators");

// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });
// };

// const sendTokenResponse = (user, statusCode, res) => {
//   const token = generateToken(user._id);
//   const options = {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//   };
//   if (process.env.NODE_ENV === "production") {
//     options.secure = true;
//   }
//   res.cookie("jwt", token, options);
//   res.status(statusCode).json({
//     success: true,
//     token,
//     user: {
//       id: user._id,
//       email: user.email,
//       role: user.role,
//       name: user.name,
//       phone: user.phone, // Added phone to response
//     },
//   });
// };

// exports.register = async (req, res) => {
//   const { email, password, role, name, organization, address, phone } =
//     req.body;

//   if (!validateEmailDomain(email)) {
//     return res.status(400).json({ message: "Email domain not allowed" });
//   }

//   try {
//     const user = await User.create({
//       email,
//       password,
//       role,
//       name,
//       organization,
//       address,
//       phone,
//     });
//     sendTokenResponse(user, 201, res);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res
//       .status(400)
//       .json({ message: "Please provide email and password" });
//   }

//   try {
//     const user = await User.findOne({ email }).select("+password");
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }
//     sendTokenResponse(user, 200, res);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.logout = (req, res) => {
//   res.cookie("jwt", "expired", {
//     expires: new Date(Date.now() + 10 * 1000),
//     httpOnly: true,
//   });
//   res.status(200).json({ success: true, message: "Logged out successfully" });
// };

// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validateEmailDomain } = require("../utils/validators");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const options = {
    httpOnly: true,
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // Use maxAge for consistency
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
    options.sameSite = "none"; // Required for cross-site cookies in production
  } else {
    options.sameSite = "lax"; // Default for same-site in development
  }

  res.cookie("jwt", token, options);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone, // Added phone to response
    },
  });
};

exports.register = async (req, res) => {
  const { email, password, role, name, organization, address, phone } =
    req.body;

  if (!validateEmailDomain(email)) {
    return res.status(400).json({ message: "Email domain not allowed" });
  }

  try {
    const user = await User.create({
      email,
      password,
      role,
      name,
      organization,
      address,
      phone,
    });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = (req, res) => {
  const options = {
    httpOnly: true,
    maxAge: 10 * 1000, // Short expiration for logout
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
    options.sameSite = "none";
  } else {
    options.sameSite = "lax";
  }

  res.cookie("jwt", "expired", options);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
