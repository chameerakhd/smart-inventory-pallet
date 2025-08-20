// const db = require("../models");
// const SubDiscountType = db.SubDiscountType;

exports.getAllSubDiscountTypes = async (req, res) => {
  try {
    const db = req.db; // Use the database instance from the request
    const SubDiscountType = db.SubDiscountType; // Use the SubDiscountType model from the database instance
    const subDiscountTypes = await SubDiscountType.findAll();
    res.status(200).json(subDiscountTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubDiscountTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const SubDiscountType = db.SubDiscountType; // Use the SubDiscountType model from the database instance
    const subDiscountType = await SubDiscountType.findOne({
      where: { sub_discount_type_id: id },
    });
    if (subDiscountType) {
      res.status(200).json(subDiscountType);
    } else {
      res
        .status(404)
        .json({ message: `SubDiscountType with id ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSubDiscountType = async (req, res) => {
  try {
    const db = req.db; // Use the database instance from the request
    const SubDiscountType = db.SubDiscountType; // Use the SubDiscountType model from the database instance
    const { sub_discount_type, discount_amount } = req.body;
    const newSubDiscountType = await SubDiscountType.create({
      sub_discount_type,
      discount_amount,
    });
    res.status(201).json(newSubDiscountType);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to create sub discount type",
    });
  }
};

exports.updateSubDiscountType = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const SubDiscountType = db.SubDiscountType; // Use the SubDiscountType model from the database instance
    const [updated] = await SubDiscountType.update(req.body, {
      where: { sub_discount_type_id: id },
    });
    if (updated) {
      const updatedSubDiscountType = await SubDiscountType.findOne({
        where: { sub_discount_type_id: id },
      });
      return res.status(200).json(updatedSubDiscountType);
    }
    throw new Error("SubDiscountType not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteSubDiscountType = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const SubDiscountType = db.SubDiscountType; // Use the SubDiscountType model from the database instance
    const deleted = await SubDiscountType.destroy({
      where: { sub_discount_type_id: id },
    });
    if (deleted) {
      return res.status(204).send("SubDiscountType deleted");
    }
    throw new Error("SubDiscountType not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
