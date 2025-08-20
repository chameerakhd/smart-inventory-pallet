// const db = require("../models");
// const Lorry = db.Lorry;

exports.getAllLorries = async (req, res) => {
  try {
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const lorries = await Lorry.findAll();
    res.status(200).json(lorries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLorryById = async (req, res) => {
  try {
    const { id } = req.params;
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const lorry = await Lorry.findOne({
      where: { lorry_id: id },
    });
    if (lorry) {
      res.status(200).json(lorry);
    } else {
      res.status(404).json({ message: `Lorry with id ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLorry = async (req, res) => {
  try {
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const { lorry_number, driver_name, contact_number, active } = req.body;
    const newLorry = await Lorry.create({
      lorry_number,
      driver_name,
      contact_number,
      active: active !== undefined ? active : true,
    });
    res.status(201).json(newLorry);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to create lorry",
    });
  }
};

exports.updateLorry = async (req, res) => {
  try {
    const { id } = req.params;
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const [updated] = await Lorry.update(req.body, {
      where: { lorry_id: id },
    });
    if (updated) {
      const updatedLorry = await Lorry.findOne({
        where: { lorry_id: id },
      });
      return res.status(200).json(updatedLorry);
    }
    throw new Error("Lorry not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteLorry = async (req, res) => {
  try {
    const { id } = req.params;
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const deleted = await Lorry.destroy({
      where: { lorry_id: id },
    });
    if (deleted) {
      return res.status(204).send("Lorry deleted");
    }
    throw new Error("Lorry not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
