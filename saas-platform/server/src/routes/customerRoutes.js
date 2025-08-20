const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all customers
router.get("/", verifyToken, customerController.getAllCustomers);

// Get customer by ID
router.get("/:id", verifyToken, customerController.getCustomerById);

// Create a new customer
router.post("/", verifyToken, customerController.createCustomer);

// Update a customer
router.put("/:id", verifyToken, customerController.updateCustomer);

// Delete a customer
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  customerController.deleteCustomer
);

// Process credit payment for a customer
router.post(
  "/:id/credit-payment",
  verifyToken,
  customerController.processCreditPayment
);

module.exports = router;
