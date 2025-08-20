const express = require("express");
const router = express.Router();
const transactionDetailController = require("../controllers/transactionDetailController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all transaction details
router.get(
  "/",
  verifyToken,
  transactionDetailController.getAllTransactionDetails
);

// Get transaction detail by ID
router.get(
  "/:id",
  verifyToken,
  transactionDetailController.getTransactionDetailById
);

// Get transaction details by transaction ID
router.get(
  "/transaction/:transactionId",
  verifyToken,
  transactionDetailController.getDetailsByTransactionId
);

// Create a new transaction detail
router.post(
  "/",
  verifyToken,
  transactionDetailController.createTransactionDetail
);

// Update a transaction detail
router.put(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  transactionDetailController.updateTransactionDetail
);

// Delete a transaction detail
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  transactionDetailController.deleteTransactionDetail
);

module.exports = router;
