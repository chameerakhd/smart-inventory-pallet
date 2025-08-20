const express = require("express");
const router = express.Router();
const unloadingTransactionController = require("../controllers/unloadingTransactionController");

// Get all unloading transactions
router.get("/", unloadingTransactionController.getRecentUnloadingTransactions);

// Get a specific unloading transaction by ID
router.get("/:id", unloadingTransactionController.getUnloadingTransactionById);

// Create a new unloading transaction
router.post("/", unloadingTransactionController.createUnloadingTransaction);

// Update an unloading transaction
router.put("/:id", unloadingTransactionController.updateUnloadingTransaction);

// Delete an unloading transaction
router.delete(
  "/:id",
  unloadingTransactionController.deleteUnloadingTransaction
);

// Get unloading transactions by lorry ID
router.get(
  "/lorry/:lorryId",
  unloadingTransactionController.getUnloadingTransactionsByLorryId
);

module.exports = router;
