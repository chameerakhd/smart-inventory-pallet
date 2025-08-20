const express = require("express");
const router = express.Router();
const loadingDetailController = require("../controllers/loadingDetailController");

// Get all loading details
router.get("/", loadingDetailController.getAllLoadingDetails);

// Get a specific loading detail by ID
router.get("/:id", loadingDetailController.getLoadingDetailById);

// Create a new loading detail
router.post("/", loadingDetailController.createLoadingDetail);

// Update a loading detail
router.put("/:id", loadingDetailController.updateLoadingDetail);

// Delete a loading detail
router.delete("/:id", loadingDetailController.deleteLoadingDetail);

// Get loading details by loading transaction ID
router.get(
  "/transaction/:loadingId",
  loadingDetailController.getLoadingDetailsByLoadingId
);

// Get loading details by product ID
router.get(
  "/product/:productId",
  loadingDetailController.getLoadingDetailsByProductId
);

module.exports = router;
