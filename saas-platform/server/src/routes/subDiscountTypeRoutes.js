const express = require("express");
const router = express.Router();
const subDiscountTypeController = require("../controllers/subDiscountTypeController");

router.get("/", subDiscountTypeController.getAllSubDiscountTypes);
router.get("/:id", subDiscountTypeController.getSubDiscountTypeById);
router.post("/", subDiscountTypeController.createSubDiscountType);
router.put("/:id", subDiscountTypeController.updateSubDiscountType);
router.delete("/:id", subDiscountTypeController.deleteSubDiscountType);

module.exports = router;
