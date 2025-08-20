const db = require("../models");
const { PurchaseInvoice, Supplier, Transaction, TransactionDetail, sequelize } =
  db;

// Get all purchase invoices
exports.getAllPurchaseInvoices = async (req, res) => {
  try {
    const PurchaseInvoice = req.db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance
    const Supplier = req.db.Supplier; // Use the Supplier model from the database instance

    const purchaseInvoices = await PurchaseInvoice.findAll({
      include: [{ model: Supplier, as: "supplier" }],
    });
    return res.status(200).json(purchaseInvoices);
  } catch (error) {
    console.error("Error getting purchase invoices:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get purchase invoice by ID
exports.getPurchaseInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const PurchaseInvoice = req.db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance
    const Supplier = req.db.Supplier; // Use the Supplier model from the database instance
    const purchaseInvoice = await PurchaseInvoice.findByPk(id, {
      include: [{ model: Supplier, as: "supplier" }],
    });

    if (!purchaseInvoice) {
      return res.status(404).json({ message: "Purchase invoice not found" });
    }

    return res.status(200).json(purchaseInvoice);
  } catch (error) {
    console.error("Error getting purchase invoice:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new purchase invoice
exports.createPurchaseInvoice = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.Transaction.sequelize;
  const transaction = await sequelizeInstance.transaction();

  const PurchaseInvoice = db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance
  const Supplier = db.Supplier; // Use the Supplier model from the database instance
  const Transaction = db.Transaction; // Use the Transaction model from the database instance
  const TransactionDetail = db.TransactionDetail; // Use the TransactionDetail model from the database instance

  try {
    const {
      purchase_number,
      supplier_id,
      purchase_date,
      due_date,
      total_amount,
      paid_amount,
      status,
      notes,
    } = req.body;

    // Validation
    if (!purchase_number) {
      await transaction.rollback();
      return res.status(400).json({ message: "Purchase number is required" });
    }

    if (!supplier_id) {
      await transaction.rollback();
      return res.status(400).json({ message: "Supplier ID is required" });
    }

    if (!purchase_date) {
      await transaction.rollback();
      return res.status(400).json({ message: "Purchase date is required" });
    }

    if (total_amount === undefined) {
      await transaction.rollback();
      return res.status(400).json({ message: "Total amount is required" });
    }

    // Create the purchase invoice
    const newPurchaseInvoice = await PurchaseInvoice.create(
      {
        purchase_number,
        supplier_id,
        purchase_date,
        due_date,
        total_amount,
        paid_amount: paid_amount || 0,
        amount_due: total_amount - (paid_amount || 0),
        status:
          paid_amount &&
          parseFloat(paid_amount) > 0 &&
          parseFloat(paid_amount) < parseFloat(total_amount)
            ? "partially paid"
            : paid_amount && parseFloat(paid_amount) >= parseFloat(total_amount)
              ? "paid"
              : status || "pending",
        notes,
      },
      { transaction }
    );

    // Update supplier outstanding balance
    const supplier = await Supplier.findByPk(supplier_id, { transaction });
    if (supplier) {
      const newBalance =
        supplier.outstanding_balance + (total_amount - (paid_amount || 0));
      await supplier.update(
        { outstanding_balance: newBalance },
        { transaction }
      );
    }

    // Create transaction record only if there's a paid amount
    if (paid_amount && parseFloat(paid_amount) > 0) {
      const invoiceTime = new Date().toTimeString().substring(0, 5);

      // Create a transaction for the payment
      const paymentTransaction = await Transaction.create(
        {
          reference_number: 1,
          transaction_date: purchase_date,
          transaction_time: invoiceTime,
          transaction_type_id: 3, // "Supplier Payment" transaction type
          amount: parseFloat(paid_amount),
          payment_method_id: 1, // Default payment method
          description: `Payment for Purchase Invoice #${purchase_number}`,
          status: "completed",
          reference_document: `Invoice #${purchase_number}`,
          supplier_id: supplier_id,
        },
        { transaction }
      );

      // Create transaction detail for the payment
      await TransactionDetail.create(
        {
          transaction_id: paymentTransaction.transaction_id,
          entity_id: newPurchaseInvoice.invoice_id,
          entity_type: "purchase_invoice",
          amount: parseFloat(paid_amount),
          notes: "Payment against invoice",
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Get the newly created invoice with related data
    const createdInvoice = await PurchaseInvoice.findByPk(
      newPurchaseInvoice.purchase_id,
      {
        include: [{ model: Supplier, as: "supplier" }],
      }
    );

    return res.status(201).json(createdInvoice);
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating purchase invoice:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Purchase number already exists" });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a purchase invoice
exports.updatePurchaseInvoice = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.PurchaseInvoice.sequelize;
  const transaction = await sequelizeInstance.transaction();

  const PurchaseInvoice = db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance
  const Supplier = db.Supplier; // Use the Supplier model from the database instance

  try {
    const { id } = req.params;
    const {
      purchase_number,
      supplier_id,
      purchase_date,
      total_amount,
      paid_amount,
      status,
    } = req.body;

    const purchaseInvoice = await PurchaseInvoice.findByPk(id, { transaction });

    if (!purchaseInvoice) {
      await transaction.rollback();
      return res.status(404).json({ message: "Purchase invoice not found" });
    }

    // If just marking as paid without specifying paid_amount, set paid_amount = total_amount
    if (status === "paid" && paid_amount === undefined) {
      paid_amount = purchaseInvoice.total_amount;
    }

    // Calculate the difference in outstanding balance
    const oldAmountDue = purchaseInvoice.amount_due || 0;
    const newAmountDue = Math.max(
      0,
      (total_amount !== undefined
        ? parseFloat(total_amount)
        : parseFloat(purchaseInvoice.total_amount)) -
        (paid_amount !== undefined
          ? parseFloat(paid_amount)
          : parseFloat(purchaseInvoice.paid_amount || 0))
    );
    const balanceDifference = newAmountDue - oldAmountDue;

    // Update purchase invoice fields
    await purchaseInvoice.update(
      {
        purchase_number: purchase_number || purchaseInvoice.purchase_number,
        supplier_id: supplier_id || purchaseInvoice.supplier_id,
        purchase_date: purchase_date || purchaseInvoice.purchase_date,
        total_amount:
          total_amount !== undefined
            ? parseFloat(total_amount)
            : parseFloat(purchaseInvoice.total_amount),
        paid_amount:
          paid_amount !== undefined
            ? parseFloat(paid_amount)
            : parseFloat(purchaseInvoice.paid_amount || 0),
        amount_due: newAmountDue,
        status: status || purchaseInvoice.status,
      },
      { transaction }
    );

    // Update supplier outstanding balance if there's a change
    if (balanceDifference !== 0) {
      const supplier = await Supplier.findByPk(purchaseInvoice.supplier_id, {
        transaction,
      });
      if (supplier) {
        // Ensure we're working with numbers
        const currentBalance = parseFloat(supplier.outstanding_balance || 0);
        const newBalance = currentBalance + balanceDifference;

        await supplier.update(
          { outstanding_balance: Math.max(0, newBalance) },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Get the updated invoice with related data
    const updatedInvoice = await PurchaseInvoice.findByPk(id, {
      include: [{ model: Supplier, as: "supplier" }],
    });

    return res.status(200).json(updatedInvoice);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating purchase invoice:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Purchase number already exists" });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a purchase invoice
exports.deletePurchaseInvoice = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.PurchaseInvoice.sequelize;
  const transaction = await sequelizeInstance.transaction();

  const PurchaseInvoice = db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance
  const Supplier = db.Supplier; // Use the Supplier model from the database instance

  try {
    const { id } = req.params;
    const purchaseInvoice = await PurchaseInvoice.findByPk(id, { transaction });

    if (!purchaseInvoice) {
      await transaction.rollback();
      return res.status(404).json({ message: "Purchase invoice not found" });
    }

    // Update supplier outstanding balance
    const supplier = await Supplier.findByPk(purchaseInvoice.supplier_id, {
      transaction,
    });
    if (supplier) {
      const newBalance =
        supplier.outstanding_balance - purchaseInvoice.amount_due;
      await supplier.update(
        { outstanding_balance: Math.max(0, newBalance) },
        { transaction }
      );
    }

    await purchaseInvoice.destroy({ transaction });
    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Purchase invoice deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting purchase invoice:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
