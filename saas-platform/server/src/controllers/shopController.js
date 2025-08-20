// const db = require("../models");
// const Shop = db.Shop;
// const ShopDiscountValue = db.ShopDiscountValue;
// const SubDiscountType = db.SubDiscountType;
// const CocaColaMonth = db.CocaColaMonth;

exports.getAllShops = async (req, res) => {
  try {
    // Fetch the discount type name from discount_type_id
    const db = req.db; // Use the database instance from the request
    const Shop = db.Shop; // Use the Shop model from the database instance
    const shops = await Shop.findAll({
      include: [
        {
          model: db.DiscountType,
          as: "discountType",
          attributes: ["discount_name"],
        },
      ],
    });
    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all shop with discount values
exports.getAllShopsWithDiscountValues = async (req, res) => {
  try {
    const db = req.db; // Use the database instance from the request
    const Shop = db.Shop; // Use the Shop model from the database instance
    const ShopDiscountValue = db.ShopDiscountValue; // Use the ShopDiscountValue model from the database instance
    // Fetch the discount type name from discount_type_id and include all sub discount types belongs to that discount type
    const shops = await Shop.findAll({
      include: [
        {
          model: db.DiscountType,
          as: "discountType",
          attributes: ["discount_name"],
          include: [
            {
              model: db.SubDiscountType,
              as: "subDiscountTypes",
              attributes: ["sub_discount_name"],
            },
          ],
        },
        {
          model: ShopDiscountValue,
          as: "shopDiscountValues",
          include: [
            {
              model: db.SubDiscountType,
              as: "subDiscountType",
              attributes: ["sub_discount_name"],
            },
          ],
        },
      ],
    });
    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const Shop = db.Shop; // Use the Shop model from the database instance
    const ShopDiscountValue = db.ShopDiscountValue; // Use the ShopDiscountValue model from the database instance
    const SubDiscountType = db.SubDiscountType; // Use the SubDiscountType model from the database instance

    // Fetch the discount type name from discount_type_id and include all sub discount types belongs to that discount type
    const shop = await Shop.findOne({
      where: { shop_id: id },
      include: [
        {
          model: db.DiscountType,
          as: "discountType",
          attributes: ["discount_name"],
          include: [
            {
              model: SubDiscountType,
              as: "subDiscountTypes",
              attributes: ["sub_discount_name"],
            },
          ],
        },
        {
          model: ShopDiscountValue,
          as: "shopDiscountValues",
          include: [
            {
              model: SubDiscountType,
              as: "subDiscountType",
              attributes: ["sub_discount_name"],
            },
          ],
        },
      ],
    });

    // const shop = await Shop.findOne({
    //   where: { shop_id: id },
    // });
    if (shop) {
      res.status(200).json(shop);
    } else {
      res.status(404).json({ message: `Shop with id ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createShop = async (req, res) => {
  try {
    const { shop_name, max_discounted_cases, discount_type } = req.body;
    const db = req.db; // Use the database instance from the request
    const Shop = db.Shop; // Use the Shop model from the database instance

    // find discount type id from discount type name
    const discountType = await db.DiscountType.findOne({
      where: { discount_name: discount_type },
    });
    if (!discountType) {
      return res.status(400).json({
        message: `Discount type ${discount_type} not found`,
      });
    }
    const newShop = await Shop.create({
      shop_name,
      max_discounted_cases,
      discount_type_id: discountType.discount_type_id,
    });
    res.status(201).json(newShop);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to create shop",
    });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const Shop = db.Shop; // Use the Shop model from the database instance
    const [updated] = await Shop.update(req.body, {
      where: { shop_id: id },
    });
    if (updated) {
      const updatedShop = await Shop.findOne({
        where: { shop_id: id },
      });
      return res.status(200).json(updatedShop);
    }
    throw new Error("Shop not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const Shop = db.Shop; // Use the Shop model from the database instance
    const deleted = await Shop.destroy({
      where: { shop_id: id },
    });
    if (deleted) {
      return res.status(204).send("Shop deleted");
    }
    throw new Error("Shop not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Set discount limits for a shop
exports.setShopDiscountLimits = async (req, res) => {
  try {
    const { shopId, discountValues, maxDiscountedCases, startDate, endDate } =
      req.body;

    const db = req.db; // Use the database instance from the request
    const Shop = db.Shop; // Use the Shop model from the database instance
    const ShopDiscountValue = db.ShopDiscountValue; // Use the ShopDiscountValue model from the database instance
    const SubDiscountType = db.SubDiscountType; // Use the SubDiscountType model from the database instance
    const CocaColaMonth = db.CocaColaMonth; // Use the CocaColaMonth model from the database instance

    // set coca cola month using startDate and endDate if that is not null
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return res.status(400).json({
          message: "Start date cannot be greater than end date",
        });
      }
      await CocaColaMonth.create({
        start_date: start,
        end_date: end,
      });
    }

    const shop = await Shop.findOne({
      where: { shop_id: shopId },
    });

    if (!shop) {
      return res
        .status(404)
        .json({ message: `Shop with id ${shopId} not found` });
    }

    // Update shop with max discounted cases and discount dates
    const [updated] = await Shop.update(
      {
        max_discounted_cases: maxDiscountedCases,
      },
      { where: { shop_id: shopId } }
    );

    if (!updated) {
      throw new Error("Failed to update shop discount limits");
    }

    // Handle sub-discount values
    // First, delete existing discount values for this shop
    await ShopDiscountValue.destroy({
      where: { shop_id: shopId },
    });

    // Then insert new discount values
    const shopDiscountValues = [];
    for (const [type, value] of Object.entries(discountValues)) {
      // Find the sub_discount_type_id based on name
      const subDiscountType = await SubDiscountType.findOne({
        where: { sub_discount_name: type },
      });

      if (!subDiscountType) {
        throw new Error(`Sub-discount type ${type} not found`);
      }

      // Create new shop discount value
      const newValue = await ShopDiscountValue.create({
        shop_id: shopId,
        sub_discount_type_id: subDiscountType.sub_discount_type_id,
        discount_value: parseFloat(value),
      });

      shopDiscountValues.push(newValue);
    }

    // Fetch updated shop with all its discount values - WITH CORRECT ALIAS
    const updatedShop = await Shop.findOne({
      where: { shop_id: shopId },
      include: [
        {
          model: ShopDiscountValue,
          as: "shopDiscountValues",
          include: [
            {
              model: SubDiscountType,
              as: "subDiscountType",
              attributes: ["sub_discount_name"],
            },
          ],
        },
      ],
    });

    return res.status(200).json(updatedShop);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
