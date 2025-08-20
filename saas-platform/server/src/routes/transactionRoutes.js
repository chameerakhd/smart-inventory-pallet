const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all transactions
router.get("/", verifyToken, transactionController.getAllTransactions);

// Get transaction by ID
router.get("/:id", verifyToken, transactionController.getTransactionById);

// Create a new transaction
router.post("/", verifyToken, transactionController.createTransaction);

// Update a transaction
router.put(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  transactionController.updateTransaction
);

// Delete a transaction
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  transactionController.deleteTransaction
);

module.exports = router;
