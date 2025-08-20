const express = require("express");
const router = express.Router();
const bankAccountController = require("../controllers/bankAccountController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all bank accounts
router.get("/", verifyToken, bankAccountController.getAllBankAccounts);

// Get bank account by ID
router.get("/:id", verifyToken, bankAccountController.getBankAccountById);

// Create a new bank account
router.post(
  "/",
  verifyToken,
  authorize(["admin"]),
  bankAccountController.createBankAccount
);

// Update a bank account
router.put(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  bankAccountController.updateBankAccount
);

// Delete a bank account
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  bankAccountController.deleteBankAccount
);

module.exports = router;
