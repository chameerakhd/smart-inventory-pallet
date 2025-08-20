const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");

router.get("/", shopController.getAllShops);
// Put specific routes BEFORE parameterized routes
router.get("/with-discount-values", shopController.getAllShopsWithDiscountValues);
// Now the :id route comes after the specific route
router.get("/:id", shopController.getShopById);
router.post("/", shopController.createShop);
router.put("/:id", shopController.updateShop);
router.delete("/:id", shopController.deleteShop);
router.post("/discounts", shopController.setShopDiscountLimits);

module.exports = router;