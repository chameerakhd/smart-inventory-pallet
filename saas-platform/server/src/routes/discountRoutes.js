const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");

router.get("/", discountController.getAllDiscounts);
router.get("/:id", discountController.getDiscountById);
router.post("/", discountController.createDiscounts);
router.put("/:id", discountController.updateDiscount);
router.delete("/:id", discountController.deleteDiscount);
router.get(
  "/shop/:shopId",
  discountController.getDiscountsByShopAndCurrentMonth
);
router.get("/date-range", discountController.getDiscountsByDateRange);

module.exports = router;
