const db = require("../models");

const seedDiscountTypes = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected.");

    const discountTypes = [{ discount_name: "SSG" }, { discount_name: "SPC" }];

    for (const data of discountTypes) {
      const existingEntry = await db.DiscountType.findOne({
        where: { discount_name: data.discount_name },
      });

      if (!existingEntry) {
        await db.DiscountType.create({
          ...data,
          created_at: new Date(),
          updated_at: new Date(),
        });
        console.log(`Discount type '${data.discount_name}' added.`);
      } else {
        console.log(`Discount type '${data.discount_name}' already exists.`);
      }
    }
  } catch (error) {
    console.error("Error seeding discount types:", error);
  } finally {
    await db.sequelize.close();
    console.log("Seeding complete.");
    process.exit(0);
  }
};

seedDiscountTypes();
