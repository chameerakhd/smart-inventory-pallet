const express = require("express");
const router = express.Router();
const loadingTransactionController = require("../controllers/loadingTransactionController");

// Get all loading transactions
router.get("/", loadingTransactionController.getRecentLoadingTransactions);

// Get a specific loading transaction by ID
router.get("/:id", loadingTransactionController.getLoadingTransactionById);

// Create a new loading transaction
router.post("/", loadingTransactionController.createLoadingTransaction);

// Update a loading transaction
router.put("/:id", loadingTransactionController.updateLoadingTransaction);

// Delete a loading transaction
router.delete("/:id", loadingTransactionController.deleteLoadingTransaction);

// Get loading transactions by lorry ID
router.get(
  "/lorry/:lorryId",
  loadingTransactionController.getLoadingTransactionsByLorryId
);

router.get("/statistics", loadingTransactionController.getLoadingStatistics);

module.exports = router;
