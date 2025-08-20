const db = require("../models");
const {
  SalesInvoice,
  Customer,
  Lorry,
  Transaction,
  TransactionDetail,
  sequelize,
} = db;

// Get all sales invoices
exports.getAllSalesInvoices = async (req, res) => {
  try {
    const SalesInvoice = req.db.SalesInvoice; // Use the SalesInvoice model from the database instance
    const Customer = req.db.Customer; // Use the Customer model from the database instance
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const salesInvoices = await SalesInvoice.findAll({
      include: [
        { model: Customer, as: "customer" },
        { model: Lorry, as: "lorry" },
      ],
    });
    return res.status(200).json(salesInvoices);
  } catch (error) {
    console.error("Error getting sales invoices:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get sales invoice by ID
exports.getSalesInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const SalesInvoice = req.db.SalesInvoice; // Use the SalesInvoice model from the database instance
    const Customer = req.db.Customer; // Use the Customer model from the database instance
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const salesInvoice = await SalesInvoice.findByPk(id, {
      include: [
        { model: Customer, as: "customer" },
        { model: Lorry, as: "lorry" },
      ],
    });

    if (!salesInvoice) {
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    return res.status(200).json(salesInvoice);
  } catch (error) {
    console.error("Error getting sales invoice:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new sales invoice
exports.createSalesInvoice = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.PurchaseInvoice.sequelize;
  const transaction = await sequelizeInstance.transaction();

  const SalesInvoice = db.SalesInvoice; // Use the SalesInvoice model from the database instance
  const Customer = db.Customer; // Use the Customer model from the database instance
  const Lorry = db.Lorry; // Use the Lorry model from the database instance
  const Transaction = db.Transaction; // Use the Transaction model from the database instance
  const TransactionDetail = db.TransactionDetail; // Use the TransactionDetail model from the database instance
  const TransactionType = db.TransactionType; // Use the TransactionType model from the database instance
  const BankAccount = db.BankAccount; // Use the BankAccount model from the database instance
  const CashDrawer = db.CashDrawer;

  try {
    const {
      invoice_number,
      customer_id,
      invoice_date,
      due_date,
      total_amount,
      paid_amount,
      status,
      lorry_id,
      notes,
      payment_method_id,
    } = req.body;

    console.log("Received paid_amount:", paid_amount);
    console.log("Parsed paid_amount:", parseFloat(paid_amount));
    console.log("Payment method ID:", payment_method_id);

    // Validation
    if (!invoice_number) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invoice number is required" });
    }

    if (!customer_id) {
      await transaction.rollback();
      return res.status(400).json({ message: "Customer ID is required" });
    }

    if (!invoice_date) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invoice date is required" });
    }

    if (total_amount === undefined) {
      await transaction.rollback();
      return res.status(400).json({ message: "Total amount is required" });
    }

    // Validate transaction type if there's a paid amount
    if (paid_amount && parseFloat(paid_amount) > 0 && !payment_method_id) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Transaction type is required when payment amount is provided",
      });
    }

    // Create the sales invoice
    const newSalesInvoice = await SalesInvoice.create(
      {
        invoice_number,
        customer_id,
        invoice_date,
        due_date,
        total_amount,
        paid_amount: paid_amount !== undefined ? Number(paid_amount) : 0,
        amount_due: total_amount - (paid_amount || 0),
        status:
          paid_amount &&
          parseFloat(paid_amount) > 0 &&
          parseFloat(paid_amount) < parseFloat(total_amount)
            ? "partially paid"
            : paid_amount && parseFloat(paid_amount) >= parseFloat(total_amount)
              ? "paid"
              : status || "pending",
        lorry_id,
        notes,
      },
      { transaction }
    );

    // Update customer outstanding balance
    const customer = await Customer.findByPk(customer_id, { transaction });
    if (customer) {
      const newBalance =
        customer.outstanding_balance + (total_amount - (paid_amount || 0));
      await customer.update(
        { outstanding_balance: newBalance },
        { transaction }
      );
    }

    // Create transaction record only if there's a paid amount
    if (paid_amount && parseFloat(paid_amount) > 0) {
      const invoiceTime = new Date().toTimeString().substring(0, 5);

      // Get the transaction type to determine flow direction
      const transactionType = await TransactionType.findByPk(
        payment_method_id,
        { transaction }
      );

      if (!transactionType) {
        await transaction.rollback();
        return res.status(400).json({ message: "Invalid transaction type" });
      }

      // Create a transaction for the payment
      const paymentTransaction = await Transaction.create(
        {
          reference_number: 1,
          transaction_date: invoice_date,
          transaction_time: invoiceTime,
          payment_method_id: payment_method_id,
          amount: parseFloat(paid_amount),
          transaction_type_id: 1, // Default payment method (assuming 1 is bank transfer/deposit)
          description: `Payment for Sales Invoice #${invoice_number}`,
          status: "completed",
          reference_document: `Invoice #${invoice_number}`,
          customer_id: customer_id,
        },
        { transaction }
      );

      // Create transaction detail for the payment
      await TransactionDetail.create(
        {
          transaction_id: paymentTransaction.transaction_id,
          entity_id: newSalesInvoice.invoice_id,
          entity_type: "sales_invoice",
          amount: parseFloat(paid_amount),
          notes: "Payment against invoice",
        },
        { transaction }
      );

      // Update bank account balance if payment method is bank (payment_method_id === 1)
      if (
        paymentTransaction.payment_method_id === 2 ||
        paymentTransaction.payment_method_id === 3 ||
        paymentTransaction.payment_method_id === 4 ||
        paymentTransaction.payment_method_id === 5
      ) {
        // Get the default bank account (you may need to adjust this logic based on your setup)
        const defaultBankAccount = await BankAccount.findOne({
          order: [["account_id", "ASC"]], // Get the first bank account, or add logic to select default
          transaction,
        });

        if (defaultBankAccount) {
          // For sales invoice payments, we increase the bank balance (money coming in)
          if (transactionType.flow_direction === "in") {
            const newBankBalance =
              defaultBankAccount.current_balance + parseFloat(paid_amount);
            await defaultBankAccount.update(
              { current_balance: newBankBalance },
              { transaction }
            );
            console.log(
              `Updated bank account ${defaultBankAccount.account_id} balance by +${paid_amount}`
            );
          }
        } else {
          console.warn("No default bank account found for balance update");
        }
      } else if (paymentTransaction.payment_method_id === 1) {
        const defaultCashDrawer = await CashDrawer.findOne({
          order: [["drawer_id", "ASC"]], // Get the first bank account, or add logic to select default
          transaction,
        });

        if (defaultCashDrawer) {
          // For sales invoice payments, we increase the bank balance (money coming in)
          if (transactionType.flow_direction === "in") {
            const newDrawerBalance =
              defaultCashDrawer.current_balance + parseFloat(paid_amount);
            await defaultCashDrawer.update(
              { current_balance: newDrawerBalance },
              { transaction }
            );
            console.log(
              `Updated cash drawer ${defaultCashDrawer.drawer_id} balance by +${paid_amount}`
            );
          }
        } else {
          console.warn("No default cash drawer found for balance update");
        }
      }
    }

    await transaction.commit();

    // Get the newly created invoice with related data
    const createdInvoice = await SalesInvoice.findByPk(
      newSalesInvoice.invoice_id,
      {
        include: [
          { model: Customer, as: "customer" },
          { model: Lorry, as: "lorry" },
        ],
      }
    );

    return res.status(201).json(createdInvoice);
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating sales invoice:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Invoice number already exists" });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a sales invoice
exports.updateSalesInvoice = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.PurchaseInvoice.sequelize;
  const transaction = await sequelizeInstance.transaction();

  const SalesInvoice = db.SalesInvoice; // Use the SalesInvoice model from the database instance
  const Customer = db.Customer; // Use the Customer model from the database instance
  const Lorry = db.Lorry; // Use the Lorry model from the database instance

  try {
    const { id } = req.params;
    const {
      invoice_number,
      customer_id,
      invoice_date,
      total_amount,
      paid_amount,
      status,
      lorry_id,
    } = req.body;

    const salesInvoice = await SalesInvoice.findByPk(id, { transaction });

    if (!salesInvoice) {
      await transaction.rollback();
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    // If just marking as paid without specifying paid_amount, set paid_amount = total_amount
    if (status === "paid" && paid_amount === undefined) {
      paid_amount = salesInvoice.total_amount;
    }

    // Calculate the difference in outstanding balance
    const oldAmountDue = salesInvoice.amount_due || 0;
    const newAmountDue = Math.max(
      0,
      (total_amount !== undefined
        ? parseFloat(total_amount)
        : parseFloat(salesInvoice.total_amount)) -
        (paid_amount !== undefined
          ? parseFloat(paid_amount)
          : parseFloat(salesInvoice.paid_amount || 0))
    );
    const balanceDifference = newAmountDue - oldAmountDue;

    // Update sales invoice fields
    await salesInvoice.update(
      {
        invoice_number: invoice_number || salesInvoice.invoice_number,
        customer_id: customer_id || salesInvoice.customer_id,
        invoice_date: invoice_date || salesInvoice.invoice_date,
        total_amount:
          total_amount !== undefined
            ? parseFloat(total_amount)
            : parseFloat(salesInvoice.total_amount),
        paid_amount:
          paid_amount !== undefined
            ? parseFloat(paid_amount)
            : parseFloat(salesInvoice.paid_amount || 0),
        amount_due: newAmountDue,
        status: status || salesInvoice.status,
        lorry_id: lorry_id !== undefined ? lorry_id : salesInvoice.lorry_id,
      },
      { transaction }
    );

    // Update customer outstanding balance if there's a change
    if (balanceDifference !== 0) {
      const customer = await Customer.findByPk(salesInvoice.customer_id, {
        transaction,
      });
      if (customer) {
        // Ensure we're working with numbers
        const currentBalance = parseFloat(customer.outstanding_balance || 0);
        const newBalance = currentBalance + balanceDifference;

        await customer.update(
          { outstanding_balance: Math.max(0, newBalance) },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Get the updated invoice with related data
    const updatedInvoice = await SalesInvoice.findByPk(id, {
      include: [
        { model: Customer, as: "customer" },
        { model: Lorry, as: "lorry" },
      ],
    });

    return res.status(200).json(updatedInvoice);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating sales invoice:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Invoice number already exists" });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a sales invoice
exports.deleteSalesInvoice = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.PurchaseInvoice.sequelize;
  const transaction = await sequelizeInstance.transaction();

  const SalesInvoice = db.SalesInvoice; // Use the SalesInvoice model from the database instance
  const Customer = db.Customer; // Use the Customer model from the database instance

  try {
    const { id } = req.params;
    const salesInvoice = await SalesInvoice.findByPk(id, { transaction });

    if (!salesInvoice) {
      await transaction.rollback();
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    // Update customer outstanding balance
    const customer = await Customer.findByPk(salesInvoice.customer_id, {
      transaction,
    });
    if (customer) {
      const newBalance = customer.outstanding_balance - salesInvoice.amount_due;
      await customer.update(
        { outstanding_balance: Math.max(0, newBalance) },
        { transaction }
      );
    }

    await salesInvoice.destroy({ transaction });
    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Sales invoice deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting sales invoice:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
