const express = require("express");
const router = express.Router();
const cashDrawerController = require("../controllers/cashDrawerController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all cash drawers
router.get("/", verifyToken, cashDrawerController.getAllCashDrawers);

// Get cash drawer by ID
router.get("/:id", verifyToken, cashDrawerController.getCashDrawerById);

// Create a new cash drawer
router.post(
  "/",
  verifyToken,
  authorize(["admin"]),
  cashDrawerController.createCashDrawer
);

// Update a cash drawer
router.put(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  cashDrawerController.updateCashDrawer
);

// Delete a cash drawer
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  cashDrawerController.deleteCashDrawer
);

module.exports = router;
