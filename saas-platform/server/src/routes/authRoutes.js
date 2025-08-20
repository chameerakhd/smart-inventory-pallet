const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Login route
router.post("/login", authController.login);

router.get("/verify", authController.verifyToken);

// Protected route example - requires authentication
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authController.getUserProfile
);

module.exports = router;
