const express = require("express");
const router = express.Router();
const transactionTypeController = require("../controllers/transactionTypeController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all transaction types
router.get("/", verifyToken, transactionTypeController.getAllTransactionTypes);

// Get transaction type by ID
router.get(
  "/:id",
  verifyToken,
  transactionTypeController.getTransactionTypeById
);

// Create a new transaction type
router.post(
  "/",
  verifyToken,
  authorize(["admin"]),
  transactionTypeController.createTransactionType
);

// Update a transaction type
router.put(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  transactionTypeController.updateTransactionType
);

// Delete a transaction type
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  transactionTypeController.deleteTransactionType
);

module.exports = router;
