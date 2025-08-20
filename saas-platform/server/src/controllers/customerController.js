const db = require("../models");
const { Customer, Transaction, sequelize } = db;

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const Customer = req.db.Customer; // Use the Customer model from the database instance
    const customers = await Customer.findAll();
    return res.status(200).json(customers);
  } catch (error) {
    console.error("Error getting customers:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const Customer = req.db.Customer; // Use the Customer model from the database instance
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json(customer);
  } catch (error) {
    console.error("Error getting customer:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      contact_person,
      phone,
      address,
      email,
      credit_limit,
      outstanding_balance,
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ message: "Customer name is required" });
    }
    const Customer = req.db.Customer; // Use the Customer model from the database instance
    const newCustomer = await Customer.create({
      name,
      contact_person,
      phone,
      address,
      email,
      credit_limit: credit_limit || 0,
      outstanding_balance: outstanding_balance || 0,
    });

    return res.status(201).json(newCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      contact_person,
      phone,
      address,
      email,
      credit_limit,
      outstanding_balance,
    } = req.body;

    const Customer = req.db.Customer; // Use the Customer model from the database instance
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update customer fields
    await customer.update({
      name: name || customer.name,
      contact_person:
        contact_person !== undefined ? contact_person : customer.contact_person,
      phone: phone !== undefined ? phone : customer.phone,
      address: address !== undefined ? address : customer.address,
      email: email !== undefined ? email : customer.email,
      credit_limit:
        credit_limit !== undefined ? credit_limit : customer.credit_limit,
      outstanding_balance:
        outstanding_balance !== undefined
          ? outstanding_balance
          : customer.outstanding_balance,
    });

    return res.status(200).json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const Customer = req.db.Customer; // Use the Customer model from the database instance
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await customer.destroy();
    return res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Process customer credit payment
exports.processCreditPayment = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.Transaction.sequelize;
  const transaction = await sequelizeInstance.transaction();

  try {
    const { id } = req.params;
    const { amount, payment_method_id, description, reference_number } =
      req.body;

    // Input validation
    if (!amount || parseFloat(amount) <= 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Valid payment amount is required" });
    }

    const customer = await db.Customer.findByPk(id, { transaction });
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check if customer has outstanding balance
    if (customer.outstanding_balance <= 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Customer has no outstanding balance to pay" });
    }

    // Calculate the actual payment amount (can't exceed outstanding balance)
    const paymentAmount = Math.min(
      parseFloat(amount),
      customer.outstanding_balance
    );

    // Create a transaction record for the credit payment
    const date = new Date();
    const invoiceTime = date.toTimeString().substring(0, 5);

    const paymentTransaction = await db.Transaction.create(
      {
        reference_number:
          reference_number || Math.floor(Math.random() * 1000000),
        transaction_date: date.toISOString().split("T")[0],
        transaction_time: invoiceTime,
        transaction_type_id: 5, // Customer Credit Payment type
        amount: paymentAmount,
        payment_method_id: payment_method_id || 1, // Default to payment method 1 if not provided
        description: description || `Credit payment from customer #${id}`,
        status: "completed",
        reference_document: `Customer Credit Payment #${customer.customer_id}`,
        customer_id: customer.customer_id,
      },
      { transaction }
    );

    // Update customer outstanding balance
    const newBalance = Math.max(
      0,
      customer.outstanding_balance - paymentAmount
    );
    await customer.update({ outstanding_balance: newBalance }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      message: "Credit payment processed successfully",
      transaction: paymentTransaction,
      customer: {
        customer_id: customer.customer_id,
        name: customer.name,
        previous_balance: customer.outstanding_balance,
        payment_amount: paymentAmount,
        new_balance: newBalance,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error processing credit payment:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
