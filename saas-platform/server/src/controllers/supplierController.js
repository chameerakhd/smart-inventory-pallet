const db = require("../models");
const { Supplier } = db;

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const Supplier = req.db.Supplier; // Use the Supplier model from the database instance
    const suppliers = await Supplier.findAll();
    return res.status(200).json(suppliers);
  } catch (error) {
    console.error("Error getting suppliers:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const Supplier = req.db.Supplier; // Use the Supplier model from the database instance
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    return res.status(200).json(supplier);
  } catch (error) {
    console.error("Error getting supplier:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new supplier
exports.createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, address, email, outstanding_balance } =
      req.body;

    const Supplier = req.db.Supplier; // Use the Supplier model from the database instance

    // Validation
    if (!name) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    const newSupplier = await Supplier.create({
      name,
      contact_person,
      phone,
      address,
      email,
      outstanding_balance: outstanding_balance || 0,
    });

    return res.status(201).json(newSupplier);
  } catch (error) {
    console.error("Error creating supplier:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, address, email, outstanding_balance } =
      req.body;
    const Supplier = req.db.Supplier; // Use the Supplier model from the database instance

    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Update supplier fields
    await supplier.update({
      name: name || supplier.name,
      contact_person:
        contact_person !== undefined ? contact_person : supplier.contact_person,
      phone: phone !== undefined ? phone : supplier.phone,
      address: address !== undefined ? address : supplier.address,
      email: email !== undefined ? email : supplier.email,
      outstanding_balance:
        outstanding_balance !== undefined
          ? outstanding_balance
          : supplier.outstanding_balance,
    });

    return res.status(200).json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const Supplier = req.db.Supplier; // Use the Supplier model from the database instance
    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    await supplier.destroy();
    return res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
