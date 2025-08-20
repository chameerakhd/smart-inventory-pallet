const express = require("express");
const router = express.Router();
const unloadingDetailController = require("../controllers/unloadingDetailController");

// Get all unloading details
router.get("/", unloadingDetailController.getAllUnloadingDetails);

// Get a specific unloading detail by ID
router.get("/:id", unloadingDetailController.getUnloadingDetailById);

// Create a new unloading detail
router.post("/", unloadingDetailController.createUnloadingDetail);

// Update an unloading detail
router.put("/:id", unloadingDetailController.updateUnloadingDetail);

// Delete an unloading detail
router.delete("/:id", unloadingDetailController.deleteUnloadingDetail);

// Get unloading details by unloading transaction ID
router.get(
  "/transaction/:unloadingId",
  unloadingDetailController.getUnloadingDetailsByUnloadingId
);

// Get unloading details by product ID
router.get(
  "/product/:productId",
  unloadingDetailController.getUnloadingDetailsByProductId
);

module.exports = router;
