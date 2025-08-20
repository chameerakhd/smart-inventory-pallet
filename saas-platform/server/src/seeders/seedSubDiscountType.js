const db = require("../models");

const seedSubDiscountTypes = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected.");

    const subDiscountTypes = [
      { sub_discount_name: "ALL WO MPET", discount_type_id: 1 },
      { sub_discount_name: "ALL MPET", discount_type_id: 1 },
      { sub_discount_name: "MPET (SSG)", discount_type_id: 1 },
      { sub_discount_name: "RGB", discount_type_id: 2 },
      { sub_discount_name: "MPET (SPC)", discount_type_id: 2 },
      { sub_discount_name: "LPET", discount_type_id: 2 },
    ];

    for (const data of subDiscountTypes) {
      const existingEntry = await db.SubDiscountType.findOne({
        where: { sub_discount_name: data.sub_discount_name },
      });

      if (!existingEntry) {
        await db.SubDiscountType.create({
          ...data,
          created_at: new Date(),
          updated_at: new Date(),
        });
        console.log(`Sub-discount type '${data.sub_discount_name}' added.`);
      } else {
        console.log(
          `Sub-discount type '${data.sub_discount_name}' already exists.`
        );
      }
    }
  } catch (error) {
    console.error("Error seeding sub-discount types:", error);
  } finally {
    await db.sequelize.close();
    console.log("Seeding complete.");
    process.exit(0);
  }
};

seedSubDiscountTypes();
