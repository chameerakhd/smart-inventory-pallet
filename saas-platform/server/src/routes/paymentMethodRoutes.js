const express = require("express");
const router = express.Router();
const paymentMethodController = require("../controllers/paymentMethodController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all payment methods
router.get("/", verifyToken, paymentMethodController.getAllPaymentMethods);

// Get payment method by ID
router.get("/:id", verifyToken, paymentMethodController.getPaymentMethodById);

// Create a new payment method
router.post(
  "/",
  verifyToken,
  authorize(["admin"]),
  paymentMethodController.createPaymentMethod
);

// Update a payment method
router.put(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  paymentMethodController.updatePaymentMethod
);

// Delete a payment method
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  paymentMethodController.deletePaymentMethod
);

module.exports = router;
