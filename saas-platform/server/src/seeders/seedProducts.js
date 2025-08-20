const db = require("../models");

const seedProducts = async () => {
  try {
    await db.sequelize.authenticate(); // Ensure DB connection
    console.log("Database connected.");

    const products = [
        // 175 mL (RGB) products
        {
          product_name: "Coca Cola",
          unit_price: 82.8,
          selling_price: 92.0,
          bottles_per_case: 24,
          size: "175 mL",
          active: true,
        },
        {
          product_name: "Sprite",
          unit_price: 82.8,
          selling_price: 92.0,
          bottles_per_case: 24,
          size: "175 mL",
          active: true,
        },
        {
          product_name: "Fanta Orange",
          unit_price: 82.8,
          selling_price: 92.0,
          bottles_per_case: 24,
          size: "175 mL",
          active: true,
        },
        {
          product_name: "Fanta Portelo",
          unit_price: 82.8,
          selling_price: 92.0,
          bottles_per_case: 24,
          size: "175 mL",
          active: true,
        },
        {
          product_name: "Fanta Cream Soda",
          unit_price: 82.8,
          selling_price: 92.0,
          bottles_per_case: 24,
          size: "175 mL",
          active: true,
        },
        
        // 300 mL (RGB) products
        {
          product_name: "Coca Cola",
          unit_price: 126.95,
          selling_price: 136.5,
          bottles_per_case: 24,
          size: "300 mL",
          active: true,
        },
        {
          product_name: "Sprite",
          unit_price: 126.95,
          selling_price: 136.5,
          bottles_per_case: 24,
          size: "300 mL",
          active: true,
        },
        {
          product_name: "Fanta Orange",
          unit_price: 100,
          selling_price: 150,
          bottles_per_case: 24,
          size: "300 mL",
          active: true,
        },
        {
          product_name: "Fanta Portelo",
          unit_price: 100,
          selling_price: 150,
          bottles_per_case: 24,
          size: "300 mL",
          active: true,
        },
        {
          product_name: "Fanta Cream Soda",
          unit_price: 100,
          selling_price: 150,
          bottles_per_case: 24,
          size: "300 mL",
          active: true,
        },
        {
          product_name: "Lion Club Soda",
          unit_price: 85.56,
          selling_price: 92,
          bottles_per_case: 24,
          size: "300 mL",
          active: true,
        },
        {
          product_name: "Tonic",
          unit_price: 100,
          selling_price: 150,
          bottles_per_case: 24,
          size: "300 mL",
          active: true,
        },
        
        {
          product_name: "Kinley Club Soda",
          unit_price: 92,
          selling_price: 100,
          bottles_per_case: 24,
          size: "300 mL",
          active: true,
        },
        // 750 mL (RGB) products
        {
          product_name: "Coca Cola",
          unit_price: 160.81,
          selling_price: 204.6,
          bottles_per_case: 9,
          size: "750 mL",
          active: true,
        },
        {
          product_name: "Sprite",
          unit_price: 160.81,
          selling_price: 204.6,
          bottles_per_case: 9,
          size: "750 mL",
          active: true,
        },
        {
          product_name: "Fanta Orange",
          unit_price: 160.81,
          selling_price: 204.6,
          bottles_per_case: 9,
          size: "750 mL",
          active: true,
        },
        
        // 250 mL products (case of 16)
        {
          product_name: "Coca Cola",
          unit_price: 104.9,
          selling_price: 111.6,
          bottles_per_case: 16,
          size: "250 mL",
          active: true,
        },
        {
          product_name: "Sprite",
          unit_price: 104.9,
          selling_price: 111.6,
          bottles_per_case: 16,
          size: "250 mL",
          active: true,
        },
        {
          product_name: "Fanta Orange",
          unit_price: 104.9,
          selling_price: 111.6,
          bottles_per_case: 16,
          size: "250 mL",
          active: true,
        },
        {
          product_name: "Fanta Portelo",
          unit_price: 104.9,
          selling_price: 111.6,
          bottles_per_case: 16,
          size: "250 mL",
          active: true,
        },
        {
          product_name: "Fanta Cream Soda",
          unit_price: 104.9,
          selling_price: 111.6,
          bottles_per_case: 16,
          size: "250 mL",
          active: true,
        },
        {
          product_name: "Lion Ginger Beer",
          unit_price: 104.9,
          selling_price: 111.6,
          bottles_per_case: 16,
          size: "250 mL",
          active: true,
        },
        
        // 250 mL products (case of 24)
        // 400 mL products
        {
          product_name: "Coca Cola",
          unit_price: 156.38,
          selling_price: 167.25,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },
        {
          product_name: "Sprite",
          unit_price: 100,
          selling_price: 167.25,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },
        {
          product_name: "Fanta Orange",
          unit_price: 100,
          selling_price: 167.25,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },
        {
          product_name: "Fanta Portelo",
          unit_price: 156.38,
          selling_price: 167.25,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },
        {
          product_name: "Fanta Cream Soda",
          unit_price: 156.38,
          selling_price: 167.25,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },
        {
          product_name: "Zero Coke",
          unit_price: 100,
          selling_price: 167.25,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },
        {
          product_name: "Lion Ginger Beer",
          unit_price: 156.38,
          selling_price: 167.25,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },
        {
          product_name: "Lion Club Soda",
          unit_price: 92,
          selling_price: 100,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },

        {
          product_name: "Kinley Club Soda",
          unit_price: 100,
          selling_price: 93,
          bottles_per_case: 24,
          size: "400 mL",
          active: true,
        },
        
        // 1050 mL products
        {
          product_name: "Coca Cola",
          unit_price: 262.26,
          selling_price: 279,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        {
          product_name: "Sprite",
          unit_price: 262.26,
          selling_price: 279,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        {
          product_name: "Fanta Orange",
          unit_price: 262.26,
          selling_price: 279,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        {
          product_name: "Fanta Portelo",
          unit_price: 100,
          selling_price: 279,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        {
          product_name: "Fanta Cream Soda",
          unit_price: 262.26,
          selling_price: 279,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        {
          product_name: "Zero Coke",
          unit_price: 100,
          selling_price: 0,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        {
          product_name: "Lion Ginger Beer",
          unit_price: 262.26,
          selling_price: 279,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        {
          product_name: "Lion Club Soda",
          unit_price: 157.36,
          selling_price: 167.4,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        {
          product_name: "Kinley Club Soda",
          unit_price: 167,
          selling_price: 180,
          bottles_per_case: 12,
          size: "1050 mL",
          active: true,
        },
        
        // 1.5L products
        {
          product_name: "Coca Cola",
          unit_price: 314.71,
          selling_price: 334.8,
          bottles_per_case: 12,
          size: "1.5 L",
          active: true,
        },
        {
          product_name: "Sprite",
          unit_price: 314.71,
          selling_price: 372,
          bottles_per_case: 12,
          size: "1.5 L",
          active: true,
        },
        {
          product_name: "Fanta Orange",
          unit_price: 314.71,
          selling_price: 334.8,
          bottles_per_case: 12,
          size: "1.5 L",
          active: true,
        },
        {
          product_name: "Fanta Portelo",
          unit_price: 314.71,
          selling_price: 334.8,
          bottles_per_case: 12,
          size: "1.5 L",
          active: true,
        },
        {
          product_name: "Fanta Cream Soda",
          unit_price: 349.68,
          selling_price: 372,
          bottles_per_case: 12,
          size: "1.5 L",
          active: true,
        },
        {
          product_name: "Lion Club Soda",
          unit_price: 218.55,
          selling_price: 232.5,
          bottles_per_case: 12,
          size: "1.5 L",
          active: true,
        },
        {
          product_name: " Kinley Club Soda",
          unit_price: 232.5,
          selling_price: 250,
          bottles_per_case: 12,
          size: "1.5 L",
          active: true,
        },
        
        // 2L products
        {
          product_name: "Coca Cola",
          unit_price: 421.59,
          selling_price: 448.5,
          bottles_per_case: 9,
          size: "2 L",
          active: true,
        },
        {
          product_name: "Sprite",
          unit_price: 421.59,
          selling_price: 448.5,
          bottles_per_case: 9,
          size: "2 L",
          active: true,
        },
        {
          product_name: "Fanta Orange",
          unit_price: 100,
          selling_price: 448.5,
          bottles_per_case: 9,
          size: "2 L",
          active: true,
        },
        {
          product_name: "Fanta Portelo",
          unit_price: 100,
          selling_price: 448.5,
          bottles_per_case: 9,
          size: "2 L",
          active: true,
        },
        {
          product_name: "Fanta Cream Soda",
          unit_price: 100,
          selling_price: 448.5,
          bottles_per_case: 9,
          size: "2 L",
          active: true,
        },
        
        // 355ML Monster
        {
          product_name: "Monster",
          unit_price: 579.6,
          selling_price: 630,
          bottles_per_case: 24,
          size: "355 mL",
          active: true,
        },
        
        // Water products
        {
          product_name: "Water",
          unit_price: 64.8,
          selling_price: 72,
          bottles_per_case: 24,
          size: "500 mL",
          active: true,
        },
        {
          product_name: "Water",
          unit_price: 100.8,
          selling_price: 112,
          bottles_per_case: 15,
          size: "1 L", 
          active: true,
        },
        {
          product_name: "Water",
          unit_price: 122.40,
          selling_price: 136,
          bottles_per_case: 12,
          size: "1.5 L",
          active: true,
        },
        
    ];

    for (const product of products) {
      const existingProduct = await db.Product.findOne({
        where: {
          product_name: product.product_name,
          size: product.size,
        },
      });

      if (!existingProduct) {
        await db.Product.create(product);
        console.log(
          `Product '${product.product_name} (${product.size})' created.`
        );
      } else {
        console.log(
          `Product '${product.product_name} (${product.size})' already exists.`
        );
      }
    }
  } catch (error) {
    console.error("Error seeding products:", error);
  } finally {
    await db.sequelize.close(); // Close DB connection properly
    console.log("Product seeding complete.");
    process.exit(0);
  }
};

seedProducts();
