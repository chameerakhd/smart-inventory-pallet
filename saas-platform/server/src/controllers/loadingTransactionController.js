// const LoadingTransaction = db.LoadingTransaction;
// const LoadingDetail = db.LoadingDetail;
// const StockInventory = db.StockInventory;
// const InventoryTransaction = db.InventoryTransaction;
const { Op } = require("sequelize");

exports.getAllLoadingTransactions = async (req, res) => {
  try {
    const LoadingTransaction = req.db.LoadingTransaction; // Use the LoadingTransaction model from the database instance
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const db = req.db; // Use the database instance from the request
    const loadingTransactions = await LoadingTransaction.findAll({
      include: [
        {
          model: LoadingDetail,
          as: "loadingDetails",
          include: [
            {
              model: db.Product,
              as: "product",
              attributes: ["product_name", "product_id"],
            },
          ],
        },
        {
          model: db.Lorry,
          as: "lorry",
          attributes: ["lorry_number", "lorry_id"],
        },
      ],
      order: [
        ["loading_date", "DESC"],
        ["loading_time", "DESC"],
      ],
    });

    res.status(200).json(loadingTransactions);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to retrieve loading transactions",
    });
  }
};

exports.getLoadingTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const LoadingTransaction = req.db.LoadingTransaction; // Use the LoadingTransaction model from the database instance
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const db = req.db; // Use the database instance from the request
    const loadingTransaction = await LoadingTransaction.findOne({
      where: { loading_id: id },
      include: [
        {
          model: LoadingDetail,
          as: "loadingDetails",
          include: [
            {
              model: db.Product,
              as: "product",
              attributes: ["product_name", "product_id", "bottles_per_case"],
            },
          ],
        },
        {
          model: db.Lorry,
          as: "lorry",
          attributes: ["lorry_number", "lorry_id"],
        },
      ],
    });

    if (loadingTransaction) {
      res.status(200).json(loadingTransaction);
    } else {
      res.status(404).json({
        message: `Loading transaction with id ${id} not found`,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: `Failed to retrieve loading transaction with id ${req.params.id}`,
    });
  }
};

exports.createLoadingTransaction = async (req, res) => {
  // Start a database transaction to ensure all operations succeed or fail together
  const db_req = req.db; // Use the database instance from the request
  const LoadingTransaction = req.db.LoadingTransaction; // Use the LoadingTransaction model from the database instance
  const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
  const sequelizeInstance = LoadingTransaction.sequelize;
  const dbTransaction = await sequelizeInstance.transaction();

  try {
    const {
      lorry_id,
      loading_date,
      loading_time,
      loaded_by,
      status,
      loadingDetails, // Array of loading details
    } = req.body;

    // Create the loading transaction
    const newLoadingTransaction = await LoadingTransaction.create(
      {
        lorry_id,
        loading_date: loading_date || new Date(),
        loading_time: loading_time || new Date().toTimeString().split(" ")[0],
        loaded_by,
        status: status || "Pending",
      },
      { transaction: dbTransaction }
    );

    // Process loading details and update inventory
    let newLoadingDetails = [];

    const InventoryTransaction = req.db.InventoryTransaction; // Use the InventoryTransaction model from the database instance
    const StockInventory = req.db.StockInventory; // Use the StockInventory model from the database instance
    const db_req = req.db; // Use the database instance from the request
    if (loadingDetails && loadingDetails.length > 0) {
      // Process each product being loaded
      for (const detail of loadingDetails) {
        // Find current inventory for this product
        const stockInventory = await StockInventory.findOne({
          where: { product_id: detail.product_id },
          transaction: dbTransaction,
        });

        const product = await db_req.Product.findOne({
          where: { product_id: detail.product_id },
        });

        if (!stockInventory) {
          throw new Error(
            `No inventory found for product ID: ${detail.product_id}`
          );
        }

        console.log("Product Get: ", product);

        // Get bottles per case
        const bottlesPerCase = product.bottles_per_case; // Default or get from product

        // Initialize adjusted quantities with requested quantities
        let adjustedCasesLoaded = detail.cases_loaded;
        let adjustedBottlesLoaded = detail.bottles_loaded;

        // Check if we need to convert cases to bottles
        while (
          adjustedBottlesLoaded > stockInventory.bottles_qty &&
          stockInventory.cases_qty > adjustedCasesLoaded
        ) {
          // Open a case
          adjustedCasesLoaded++;
          adjustedBottlesLoaded -= bottlesPerCase;
        }

        // If we still don't have enough bottles (and we've used all cases)
        if (adjustedBottlesLoaded > stockInventory.bottles_qty) {
          throw new Error(
            `Insufficient stock for product ID: ${detail.product_id}. Available: ${stockInventory.cases_qty} cases and ${stockInventory.bottles_qty} bottles. Requested: ${detail.cases_loaded} cases and ${detail.bottles_loaded} bottles.`
          );
        }

        // Calculate new inventory quantities
        const newCasesQty = stockInventory.cases_qty - adjustedCasesLoaded;
        const newBottlesQty =
          stockInventory.bottles_qty - adjustedBottlesLoaded;

        // Double check that we have enough stock (should never fail at this point)
        if (newCasesQty < 0 || newBottlesQty < 0) {
          throw new Error(
            `Calculation error resulted in negative inventory for product ID: ${detail.product_id}`
          );
        }

        // Calculate total bottles and value
        const newTotalBottles = newCasesQty * bottlesPerCase + newBottlesQty;

        // Calculate value per bottle (if total_bottles is 0, use a fallback to avoid division by zero)
        const valuePerBottle =
          stockInventory.total_bottles > 0
            ? stockInventory.total_value / stockInventory.total_bottles
            : 0;

        const newTotalValue = newTotalBottles * valuePerBottle;

        // Update the inventory
        await stockInventory.update(
          {
            cases_qty: newCasesQty,
            bottles_qty: newBottlesQty,
            total_bottles: newTotalBottles,
            total_value: newTotalValue,
            last_updated: new Date(),
          },
          { transaction: dbTransaction }
        );

        // Calculate total bottles loaded (using original request values)
        const totalBottlesLoaded =
          detail.cases_loaded * bottlesPerCase + detail.bottles_loaded;

        // Record the transaction
        await InventoryTransaction.create(
          {
            product_id: detail.product_id,
            transaction_type: "REMOVE",
            cases_qty: detail.cases_loaded,
            bottles_qty: detail.bottles_loaded,
            total_bottles: totalBottlesLoaded,
            total_value: totalBottlesLoaded * valuePerBottle,
            notes: "Loading transaction",
            transaction_date: new Date(),
          },
          { transaction: dbTransaction }
        );

        // Create the loading detail record
        const newDetail = await LoadingDetail.create(
          {
            loading_id: newLoadingTransaction.loading_id,
            product_id: detail.product_id,
            cases_loaded: detail.cases_loaded,
            bottles_loaded: detail.bottles_loaded,
            total_bottles_loaded: totalBottlesLoaded,
            value: totalBottlesLoaded * valuePerBottle,
          },
          { transaction: dbTransaction }
        );

        newLoadingDetails.push(newDetail);
      }
    }

    // Commit the transaction if everything succeeded
    await dbTransaction.commit();

    res.status(201).json({
      loadingTransaction: newLoadingTransaction,
      loadingDetails: newLoadingDetails,
    });
  } catch (error) {
    // Rollback all changes if anything fails
    await dbTransaction.rollback();

    res.status(500).json({
      error: error.message,
      message: "Failed to create loading transaction or update inventory",
    });
  }
};

exports.updateLoadingTransaction = async (req, res) => {
  const db_req = req.db; // Use the database instance from the request
  const LoadingTransaction = db_req.LoadingTransaction; // Use the LoadingTransaction model from the database instance
  const LoadingDetail = db_req.LoadingDetail; // Use the LoadingDetail model from the database instance
  const StockInventory = db_req.StockInventory; // Use the StockInventory model from the database instance
  const sequelizeInstance = LoadingTransaction.sequelize;
  const dbTransaction = await sequelizeInstance.transaction();

  try {
    const { id } = req.params;
    const { status, loadingDetails } = req.body;

    // Get the current loading transaction
    const loadingTransaction = await LoadingTransaction.findOne({
      where: { loading_id: id },
      transaction: dbTransaction,
    });

    if (!loadingTransaction) {
      throw new Error(`Loading transaction with id ${id} not found`);
    }

    // Update the loading transaction status
    await loadingTransaction.update(
      { ...req.body },
      { transaction: dbTransaction }
    );

    // If the status is changing to "Cancelled", we need to return items to inventory
    if (status === "Cancelled") {
      // Get all loading details for this transaction
      const details = await LoadingDetail.findAll({
        where: { loading_id: id },
        transaction: dbTransaction,
      });

      // Return each product to inventory
      for (const detail of details) {
        const inventory = await StockInventory.findOne({
          where: { product_id: detail.product_id },
          transaction: dbTransaction,
        });

        const product = await db_req.Product.findOne({
          where: { product_id: detail.product_id },
        });

        if (inventory) {
          const bottlesPerCase = product.bottles_per_case;
          const newCasesQty = inventory.cases_qty + detail.cases_loaded;
          const newBottlesQty = inventory.bottles_qty + detail.bottles_loaded;
          const newTotalBottles = newCasesQty * bottlesPerCase + newBottlesQty;

          // Calculate value per bottle
          const valuePerBottle =
            inventory.total_bottles > 0
              ? inventory.total_value / inventory.total_bottles
              : 0;

          const newTotalValue = newTotalBottles * valuePerBottle;

          // Update inventory
          await inventory.update(
            {
              cases_qty: newCasesQty,
              bottles_qty: newBottlesQty,
              total_bottles: newTotalBottles,
              total_value: newTotalValue,
              last_updated: new Date(),
            },
            { transaction: dbTransaction }
          );
        }
      }
    }

    // If new loading details are provided, process them
    if (loadingDetails && loadingDetails.length > 0) {
      // Implementation for updating loading details would go here
      // This would be similar to the create function but would handle
      // adding/removing products and adjusting inventory accordingly
    }

    await dbTransaction.commit();

    const updatedLoadingTransaction = await LoadingTransaction.findOne({
      where: { loading_id: id },
      include: [{ model: db_req.LoadingDetail }],
    });

    res.status(200).json(updatedLoadingTransaction);
  } catch (error) {
    await dbTransaction.rollback();
    res.status(500).json({
      error: error.message,
      message: "Failed to update loading transaction or inventory",
    });
  }
};

exports.deleteLoadingTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const LoadingTransaction = req.db.LoadingTransaction; // Use the LoadingTransaction model from the database instance
    const deleted = await LoadingTransaction.destroy({
      where: { loading_id: id },
    });
    if (deleted) {
      return res.status(204).send("Loading transaction deleted");
    }
    throw new Error("Loading transaction not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// exports.getLoadingTransactionsByLorryId = async (req, res) => {
//   try {
//     const { lorryId } = req.params;
//     const loadingTransactions = await LoadingTransaction.findAll({
//       where: { lorry_id: lorryId },
//     });
//     res.status(200).json(loadingTransactions);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getLoadingTransactionsByLorryId = async (req, res) => {
  try {
    const { lorryId } = req.params;
    const LoadingTransaction = req.db.LoadingTransaction; // Use the LoadingTransaction model from the database instance
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const db = req.db; // Use the database instance from the request
    const loadingTransactions = await LoadingTransaction.findAll({
      where: { lorry_id: lorryId },
      include: [
        {
          model: LoadingDetail,
          as: "loadingDetails",
          include: [
            {
              model: db.Product,
              as: "product",
              attributes: ["product_name", "product_id"],
            },
          ],
        },
      ],
      order: [
        ["loading_date", "DESC"],
        ["loading_time", "DESC"],
      ],
    });

    res.status(200).json(loadingTransactions);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: `Failed to retrieve loading transactions for lorry ${req.params.lorryId}`,
    });
  }
};

exports.getRecentLoadingTransactions = async (req, res) => {
  try {
    const db = req.db; // Use the database instance from the request
    const LoadingTransaction = db.LoadingTransaction; // Use the LoadingTransaction model from the database instance
    const LoadingDetail = db.LoadingDetail; // Use the LoadingDetail model from the database instance

    // Extract query parameters for filtering
    const { lorryId, startDate, endDate, limit = 10 } = req.query;

    // Build the where clause based on filters
    const whereClause = {};

    // Add lorry filter if provided
    if (lorryId) {
      whereClause.lorry_id = lorryId;
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.loading_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.loading_date = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.loading_date = {
        [Op.lte]: new Date(endDate),
      };
    }

    // Fetch loading transactions with related data
    const loadingTransactions = await LoadingTransaction.findAll({
      where: whereClause,
      include: [
        {
          model: LoadingDetail,
          as: "loadingDetails",
          include: [
            {
              model: db.Product,
              as: "product",
              attributes: [
                "product_id",
                "product_name",
                "bottles_per_case",
                "size",
              ],
            },
          ],
        },
        {
          model: db.Lorry,
          as: "lorry",
          attributes: ["lorry_id", "lorry_number"],
        },
      ],
      order: [
        ["loading_date", "DESC"],
        ["loading_time", "DESC"],
      ],
      // limit: parseInt(limit),
    });

    // Calculate summary information for each transaction
    const enhancedTransactions = loadingTransactions.map((transaction) => {
      const plainTransaction = transaction.get({ plain: true });

      // Calculate totals if loadingDetails exist
      if (
        plainTransaction.loadingDetails &&
        plainTransaction.loadingDetails.length > 0
      ) {
        plainTransaction.totalCases = plainTransaction.loadingDetails.reduce(
          (sum, detail) => sum + detail.cases_loaded,
          0
        );

        plainTransaction.totalBottles = plainTransaction.loadingDetails.reduce(
          (sum, detail) => sum + detail.bottles_loaded,
          0
        );

        plainTransaction.totalValue = plainTransaction.loadingDetails.reduce(
          (sum, detail) => sum + detail.value,
          0
        );
      } else {
        plainTransaction.totalCases = 0;
        plainTransaction.totalBottles = 0;
        plainTransaction.totalValue = 0;
      }

      return plainTransaction;
    });

    res.status(200).json(enhancedTransactions);
  } catch (error) {
    console.error("Error fetching loading transactions:", error);
    res.status(500).json({
      error: error.message,
      message: "Failed to retrieve recent loading transactions",
    });
  }
};

// This function is specifically for the Overview tab
exports.getLoadingStatistics = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    // Get current date
    const currentDate = new Date();
    let startDate;

    // Determine start date based on period
    if (period === "week") {
      // Start of current week (Sunday)
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      // Start of current month
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
    } else if (period === "year") {
      // Start of current year
      startDate = new Date(currentDate.getFullYear(), 0, 1);
    } else {
      // Default to month if invalid period
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
    }

    const LoadingTransaction = req.db.LoadingTransaction; // Use the LoadingTransaction model from the database instance
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const db = req.db; // Use the database instance from the request

    // Get all loading transactions for the period
    const loadingTransactions = await LoadingTransaction.findAll({
      where: {
        loading_date: {
          [Op.between]: [startDate, currentDate],
        },
      },
      include: [
        {
          model: LoadingDetail,
          as: "loadingDetails",
          include: [
            {
              model: db.Product,
              as: "product",
              attributes: ["product_id", "product_name"],
            },
          ],
        },
        {
          model: db.Lorry,
          as: "lorry",
          attributes: ["lorry_id", "lorry_number"],
        },
      ],
    });

    // Initialize statistics object
    const statistics = {
      totalCasesLoaded: 0,
      totalBottlesLoaded: 0,
      totalValueLoaded: 0,
      productCounts: {},
      lorryCounts: {},
      loadSizes: [],
    };

    // Process each transaction
    loadingTransactions.forEach((transaction) => {
      const plainTransaction = transaction.get({ plain: true });
      let transactionCases = 0;

      if (
        plainTransaction.loadingDetails &&
        plainTransaction.loadingDetails.length > 0
      ) {
        plainTransaction.loadingDetails.forEach((detail) => {
          // Update total counts
          statistics.totalCasesLoaded += detail.cases_loaded || 0;
          statistics.totalBottlesLoaded += detail.bottles_loaded || 0;
          statistics.totalValueLoaded += detail.value || 0;
          transactionCases += detail.cases_loaded || 0;

          // Update product counts
          const productId = detail.product.product_id;
          const productName = detail.product.product_name;

          if (!statistics.productCounts[productId]) {
            statistics.productCounts[productId] = {
              productName,
              cases: 0,
              bottles: 0,
            };
          }

          statistics.productCounts[productId].cases += detail.cases_loaded || 0;
          statistics.productCounts[productId].bottles +=
            detail.bottles_loaded || 0;
        });
      }

      // Update lorry counts
      const lorryId = plainTransaction.lorry.lorry_id;
      const lorryNumber = plainTransaction.lorry.lorry_number;

      if (!statistics.lorryCounts[lorryId]) {
        statistics.lorryCounts[lorryId] = {
          lorryNumber,
          count: 0,
          totalCases: 0,
        };
      }

      statistics.lorryCounts[lorryId].count += 1;
      statistics.lorryCounts[lorryId].totalCases += transactionCases;

      // Add to load sizes for average calculation
      statistics.loadSizes.push(transactionCases);
    });

    // Calculate most loaded product
    const productEntries = Object.entries(statistics.productCounts);
    statistics.mostLoadedProduct =
      productEntries.length > 0
        ? productEntries.reduce((max, current) =>
            current[1].cases > max[1].cases ? current : max
          )
        : null;

    if (statistics.mostLoadedProduct) {
      statistics.mostLoadedProduct = {
        productId: statistics.mostLoadedProduct[0],
        productName: statistics.mostLoadedProduct[1].productName,
        cases: statistics.mostLoadedProduct[1].cases,
        bottles: statistics.mostLoadedProduct[1].bottles,
      };
    } else {
      statistics.mostLoadedProduct = {
        productName: "N/A",
        cases: 0,
        bottles: 0,
      };
    }

    // Calculate most active lorry
    const lorryEntries = Object.entries(statistics.lorryCounts);
    statistics.mostActiveLorry =
      lorryEntries.length > 0
        ? lorryEntries.reduce((max, current) =>
            current[1].count > max[1].count ? current : max
          )
        : null;

    if (statistics.mostActiveLorry) {
      statistics.mostActiveLorry = {
        lorryId: statistics.mostActiveLorry[0],
        lorryNumber: statistics.mostActiveLorry[1].lorryNumber,
        count: statistics.mostActiveLorry[1].count,
        totalCases: statistics.mostActiveLorry[1].totalCases,
      };
    } else {
      statistics.mostActiveLorry = {
        lorryNumber: "N/A",
        count: 0,
        totalCases: 0,
      };
    }

    // Calculate average load size
    statistics.averageLoadSize =
      statistics.loadSizes.length > 0
        ? statistics.loadSizes.reduce((sum, size) => sum + size, 0) /
          statistics.loadSizes.length
        : 0;

    // Clean up the response by removing unnecessary data
    delete statistics.productCounts;
    delete statistics.lorryCounts;
    delete statistics.loadSizes;

    res.status(200).json({
      period,
      statistics,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to retrieve loading statistics",
    });
  }
};
