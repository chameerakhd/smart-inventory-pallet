import React, { useState } from "react";

const AddDiscountShopTab = ({ onAddShop }) => {
  const [shopName, setShopName] = useState("");
  const [discountType, setDiscountType] = useState("SSG");
  // const [maxDiscountedCases, setMaxDiscountedCases] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" });

  // Reset form
  const resetForm = () => {
    setShopName("");
    setDiscountType("SSG");
    // setMaxDiscountedCases(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!shopName.trim()) {
      setStatus({
        type: "error",
        message: "Please enter a shop name.",
      });
      return;
    }

    // Convert maxDiscountedCases to number
    // const maxCases = parseInt(maxDiscountedCases, 10);
    // if (isNaN(maxCases) || maxCases < 0) {
    //   setStatus({
    //     type: "error",
    //     message: "Please enter a valid number for max discounted cases.",
    //   });
    //   return;
    // }

    const shopData = {
      shop_name: shopName.trim(),
      discount_type: discountType,
      // max_discounted_cases: maxCases,
    };

    const result = await onAddShop(shopData);

    if (result.success) {
      setStatus({
        type: "success",
        message: "Shop added successfully!",
      });
      resetForm();
    } else {
      setStatus({
        type: "error",
        message: result.error || "Failed to add shop.",
      });
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Add Discount Shop</h2>

      {status.message && (
        <div
          className={`mb-4 p-3 rounded ${
            status.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="">
        {/* Shop Name */}
        <div className="mb-4">
          <label
            htmlFor="shopName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Shop Name
          </label>
          <input
            type="text"
            id="shopName"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Discount Type (formerly Shop Type) */}
        <div className="mb-4">
          <label
            htmlFor="discountType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Discount Type
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="discountType"
                value="SSG"
                checked={discountType === "SSG"}
                onChange={() => setDiscountType("SSG")}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
              <span className="ml-2">SSG</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="discountType"
                value="SPC"
                checked={discountType === "SPC"}
                onChange={() => setDiscountType("SPC")}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
              <span className="ml-2">SPC</span>
            </label>
          </div>
        </div>

        {/* Max Discounted Cases
        <div className="mb-6">
          <label
            htmlFor="maxDiscountedCases"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Max Discounted Cases
          </label>
          <input
            type="number"
            id="maxDiscountedCases"
            value={maxDiscountedCases}
            onChange={(e) => setMaxDiscountedCases(e.target.value)}
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div> */}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Add Shop
        </button>
      </form>
    </div>
  );
};

export default AddDiscountShopTab;
