import React, { useState, useEffect } from "react";

const LorryPerformance = ({
  products,
  lorryData,
  loadingTransactions,
  unloadingTransactions,
  salesData,
  expiryReturns,
  emptyReturns,
  dateRange,
}) => {
  const [selectedLorry, setSelectedLorry] = useState(lorryData[0]?.lorry_id);
  const [lorryPerformanceData, setLorryPerformanceData] = useState([]);
  const [totals, setTotals] = useState({
    totalLoadingCases: 0,
    totalLoadingBottles: 0,
    totalUnloadingCases: 0,
    totalUnloadingBottles: 0,
    totalSoldUnits: 0,
    totalSoldCases: 0,
    totalSalesValue: 0,
    totalProfit: 0,
    totalExpiryBottles: 0,
    totalExpiryValue: 0,
    totalEmptyCases: 0,
    totalEmptyBottles: 0,
  });

  // Process data when selected lorry changes or data changes
  useEffect(() => {
    if (!selectedLorry || !products.length) {
      setLorryPerformanceData([]);
      return;
    }

    // Create a map to hold consolidated data for each product
    const productMap = new Map();

    // Initialize with product information
    products.forEach((product) => {
      productMap.set(product.product_id, {
        // Product Details
        product_id: product.product_id,
        product_name: product.product_name,
        size: product.size || "Standard",
        case_of_bottle: product.bottles_per_case || 0,
        unit_price: product.unit_price || 0,
        selling_price: product.selling_price || 0,

        // Price Details
        profit_margin:
          product.selling_price && product.unit_price
            ? (product.selling_price - product.unit_price).toFixed(2)
            : 0,

        // Initialize lorry specific data
        cases_loaded: 0,
        bottles_loaded: 0,
        cases_returned: 0,
        bottles_returned: 0,

        // Initialize expiry and empty returns data
        expiry_bottles: 0,
        expiry_value: 0,
        empty_cases: 0,
        empty_bottles: 0,

        // Initialize sales data (will be updated)
        units_sold: 0,
        sales_value: 0,
        gross_profit: 0,
      });
    });

    // Process loading transactions for the selected lorry
    loadingTransactions
      .filter((transaction) => transaction.lorry_id === Number(selectedLorry))
      .forEach((transaction) => {
        if (
          transaction.loadingDetails &&
          transaction.loadingDetails.length > 0
        ) {
          transaction.loadingDetails.forEach((detail) => {
            const productId = detail.product_id;

            if (productMap.has(productId)) {
              const productData = productMap.get(productId);
              productData.cases_loaded += detail.cases_loaded || 0;
              productData.bottles_loaded += detail.bottles_loaded || 0;
            }
          });
        }
      });

    // Process unloading transactions for the selected lorry
    unloadingTransactions
      .filter((transaction) => transaction.lorry_id === Number(selectedLorry))
      .forEach((transaction) => {
        if (
          transaction.unloadingDetails &&
          transaction.unloadingDetails.length > 0
        ) {
          transaction.unloadingDetails.forEach((detail) => {
            const productId = detail.product_id;

            if (productMap.has(productId)) {
              const productData = productMap.get(productId);
              productData.cases_returned += detail.cases_returned || 0;
              productData.bottles_returned += detail.bottles_returned || 0;
            }
          });
        }
      });

    // Process expiry returns for the selected lorry
    expiryReturns.data
      .filter((returnItem) => returnItem.lorry_id === Number(selectedLorry))
      .forEach((returnItem) => {
        if (
          returnItem.expiryReturnsDetails &&
          returnItem.expiryReturnsDetails.length > 0
        ) {
          returnItem.expiryReturnsDetails.forEach((detail) => {
            const productId = detail.product_id;

            if (productMap.has(productId)) {
              const productData = productMap.get(productId);
              productData.expiry_bottles += detail.bottles_expired || 0;
              productData.expiry_value += detail.expiry_value || 0;
            }
          });
        }
      });

    // Process empty returns for the selected lorry
    emptyReturns.data
      .filter((returnItem) => returnItem.lorry_id === Number(selectedLorry))
      .forEach((returnItem) => {
        if (
          returnItem.emptyReturnsDetails &&
          returnItem.emptyReturnsDetails.length > 0
        ) {
          returnItem.emptyReturnsDetails.forEach((detail) => {
            const productId = detail.product_id;

            if (productMap.has(productId)) {
              const productData = productMap.get(productId);
              productData.empty_cases += detail.empty_cases_returned || 0;
              productData.empty_bottles += detail.empty_bottles_returned || 0;
            }
          });
        }
      });

    // Process sales data for the selected lorry
    salesData
      .filter((saleItem) => saleItem.lorry_id === Number(selectedLorry))
      .forEach((saleItem) => {
        const productId = saleItem.product_id;

        if (productMap.has(productId)) {
          const productData = productMap.get(productId);
          productData.units_sold += saleItem.units_sold || 0;
          productData.sales_value += saleItem.sales_income || 0;
          productData.gross_profit += saleItem.gross_profit || 0;
        }
      });
    console.log("Sales data first item:", salesData[0]);

    // Calculate bottles sold
productMap.forEach((productData) => {
  // Calculate bottles sold (loaded - returned)
  const casesToBottles =
    (productData.cases_loaded - productData.cases_returned) *
    productData.case_of_bottle;
  const individualBottles =
    productData.bottles_loaded - productData.bottles_returned;
  productData.estimated_bottles_sold = casesToBottles + individualBottles;
  
  // Calculate cases sold based on the units sold and bottles per case
  productData.cases_sold = productData.case_of_bottle === 16
    ? (productData.units_sold / (productData.case_of_bottle * 2))
    : (productData.units_sold / productData.case_of_bottle);
});

    // Convert Map to Array and filter out products with no activity
    const resultArray = Array.from(productMap.values()).filter(
      (item) =>
        item.cases_loaded > 0 ||
        item.bottles_loaded > 0 ||
        item.cases_returned > 0 ||
        item.bottles_returned > 0 ||
        item.units_sold > 0 ||
        
        item.expiry_bottles > 0 ||
        item.empty_bottles > 0 ||
        item.empty_cases > 0
    );

    // Define custom size order
    const sizeOrder = {
      "175 mL": 1,
      "250 mL": 4,
      "300 mL": 2,
      "355 mL": 9,
      "400 mL": 5,
      "500 mL": 10,
      "750 mL": 3,
      "1 L": 11,
      "1050 mL": 6,
      "1.5 L": 7,
      "2 L": 8,
      Standard: 999, // Place "Standard" at the end
    };

    // Sort by the custom size order
    const sortedData = resultArray.sort((a, b) => {
      // Get the order value for each size, defaulting to a high number if not found
      const sizeA = a.size || "Standard";
      const sizeB = b.size || "Standard";

      const orderA = sizeOrder[sizeA] !== undefined ? sizeOrder[sizeA] : 500;
      const orderB = sizeOrder[sizeB] !== undefined ? sizeOrder[sizeB] : 500;

      // For sizes not in our predefined order, fall back to numeric sorting
      if (orderA === 500 && orderB === 500) {
        // Extract numeric values for comparison
        const extractSizeValue = (size) => {
          const sizeStr = String(size).trim();
          const match = sizeStr.match(/(\d+)/);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
          return 9999;
        };

        return extractSizeValue(sizeA) - extractSizeValue(sizeB);
      }

      return orderA - orderB;
    });

    // Calculate totals
    const newTotals = sortedData.reduce(
      (acc, item) => {
        return {
          totalLoadingCases: acc.totalLoadingCases + item.cases_loaded,
          totalLoadingBottles: acc.totalLoadingBottles + item.bottles_loaded,
          totalUnloadingCases: acc.totalUnloadingCases + item.cases_returned,
          totalUnloadingBottles:
            acc.totalUnloadingBottles + item.bottles_returned,
          totalSoldUnits: acc.totalSoldUnits + item.units_sold,
          totalSoldCases: acc.totalSoldCases + (item.cases_sold || 0),
          totalSalesValue: acc.totalSalesValue + item.sales_value,
          totalProfit: acc.totalProfit + item.gross_profit,
          totalExpiryBottles: acc.totalExpiryBottles + item.expiry_bottles,
          totalExpiryValue: acc.totalExpiryValue + item.expiry_value,
          totalEmptyCases: acc.totalEmptyCases + item.empty_cases,
          totalEmptyBottles: acc.totalEmptyBottles + item.empty_bottles,
        };
      },
      {
        totalLoadingCases: 0,
        totalLoadingBottles: 0,
        totalUnloadingCases: 0,
        totalUnloadingBottles: 0,
        totalSoldUnits: 0,
        totalSoldCases: 0,
        totalSalesValue: 0,
        totalProfit: 0,
        totalExpiryBottles: 0,
        totalExpiryValue: 0,
        totalEmptyCases: 0,
        totalEmptyBottles: 0,
      }
    );

    setLorryPerformanceData(sortedData);
    setTotals(newTotals);
  }, [
    selectedLorry,
    products,
    loadingTransactions,
    unloadingTransactions,
    salesData,
    expiryReturns,
    emptyReturns,
  ]);

  // Print function
  const handlePrint = () => {
    const printWindow = window.open("", "", "height=600,width=800");

    // Get selected lorry name
    const lorryName =
      lorryData.find((l) => l.lorry_id === selectedLorry)?.lorry_number ||
      `Lorry ${selectedLorry}`;

    printWindow.document.write(
      "<html><head><title>Lorry Performance Report</title>"
    );

    // Add styles for printing
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { text-align: center; margin-bottom: 10px; }
        p { text-align: center; margin-bottom: 20px; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 4px; font-size: 12px; }
        thead { background-color: #f0f0f0; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background-color: #f0f0f0; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    `);

    printWindow.document.write("</head><body>");
    printWindow.document.write(
      `<h2>Lorry Performance Report - ${lorryName}</h2>`
    );
    printWindow.document.write(
      `<p>Period: ${
        dateRange?.startDate?.toLocaleDateString() || "All time"
      } to ${dateRange?.endDate?.toLocaleDateString() || "Present"}</p>`
    );

    // Create table
    printWindow.document.write(`
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Product</th>
            <th>Case of Bottles</th>
            <th>Unit Price</th>
            <th>Selling Price</th>
            <th>Profit Margin</th>
            <th>Cases Loaded</th>
            <th>Bottles Loaded</th>
            <th>Cases Returned</th>
            <th>Bottles Returned</th>
            <th>Expiry Bottles</th>
            <th>Expiry Value</th>
            <th>Empty Cases</th>
            <th>Empty Bottles</th>
            <th>Units Sold</th>
            <th>Sales Value</th>
            <th>Gross Profit</th>
          </tr>
        </thead>
        <tbody>
    `);

    // Add data rows
    lorryPerformanceData.forEach((item) => {
      printWindow.document.write(`
        <tr>
          <td>${item.size}</td>
          <td>${item.product_name}</td>
          <td class="text-center">${item.case_of_bottle}</td>
          <td class="text-center">${item.unit_price.toFixed(2)}</td>
          <td class="text-center">${item.selling_price.toFixed(2)}</td>
          <td class="text-center">${item.profit_margin}</td>
          <td class="text-center">${item.cases_loaded}</td>
          <td class="text-center">${item.bottles_loaded}</td>
          <td class="text-center">${item.cases_returned}</td>
          <td class="text-center">${item.bottles_returned}</td>
          <td class="text-center">${item.expiry_bottles}</td>
          <td class="text-right">${item.expiry_value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
          <td class="text-center">${item.empty_cases}</td>
          <td class="text-center">${item.empty_bottles}</td>
          <td class="text-center">${item.units_sold}</td>
          <td class="text-right">${item.sales_value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
          <td class="text-right">${item.gross_profit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
        </tr>
      `);
    });

    // Add totals row
    printWindow.document.write(`
      <tr class="total-row">
        <td colspan="6" class="text-right">Totals:</td>
        <td class="text-center">${totals.totalLoadingCases}</td>
        <td class="text-center">${totals.totalLoadingBottles}</td>
        <td class="text-center">${totals.totalUnloadingCases}</td>
        <td class="text-center">${totals.totalUnloadingBottles}</td>
        <td class="text-center">${totals.totalExpiryBottles}</td>
        <td class="text-right">${totals.totalExpiryValue.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}</td>
        <td class="text-center">${totals.totalEmptyCases}</td>
        <td class="text-center">${totals.totalEmptyBottles}</td>
        <td class="text-center">${totals.totalSoldUnits}</td>
        <td class="text-right">${totals.totalSalesValue.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}</td>
        <td class="text-right">${totals.totalProfit.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</td>
      </tr>
    `);

    printWindow.document.write("</tbody></table>");
    printWindow.document.write("</body></html>");

    printWindow.document.close();
    printWindow.focus();

    // Add slight delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Download CSV function
  const downloadCSV = () => {
    if (lorryPerformanceData.length === 0) {
      alert("No data available to export");
      return;
    }

    // Get selected lorry name
    const lorryName =
      lorryData.find((l) => l.lorry_id === selectedLorry)?.lorry_number ||
      `Lorry ${selectedLorry}`;

    // Create CSV header
    const headers = [
      "Size",
      "Product",
      "Case of Bottles",
      "Unit Price",
      "Selling Price",
      "Profit Margin",
      "Cases Loaded",
      "Bottles Loaded",
      "Cases Returned",
      "Bottles Returned",
      "Expiry Bottles",
      "Expiry Value",
      "Empty Cases",
      "Empty Bottles",
      "Units Sold",
      "Sales Value",
      "Gross Profit",
    ];

    // Convert data to CSV rows
    const csvRows = [];
    csvRows.push(headers.join(","));

    lorryPerformanceData.forEach((item) => {
      const row = [
        `"${item.size}"`,
        `"${item.product_name}"`,
        item.case_of_bottle,
        item.unit_price.toFixed(2),
        item.selling_price.toFixed(2),
        item.profit_margin,
        item.cases_loaded,
        item.bottles_loaded,
        item.cases_returned,
        item.bottles_returned,
        item.expiry_bottles,
        item.expiry_value.toFixed(2),
        item.empty_cases,
        item.empty_bottles,
        item.units_sold,
        item.sales_value.toFixed(2),
        item.gross_profit.toFixed(2),
      ];

      csvRows.push(row.join(","));
    });

    // Add totals row
    const totalsRow = [
      "Totals",
      "",
      "",
      "",
      "",
      "",
      totals.totalLoadingCases,
      totals.totalLoadingBottles,
      totals.totalUnloadingCases,
      totals.totalUnloadingBottles,
      totals.totalExpiryBottles,
      totals.totalExpiryValue.toFixed(2),
      totals.totalEmptyCases,
      totals.totalEmptyBottles,
      totals.totalSoldUnits,
      totals.totalSalesValue.toFixed(2),
      totals.totalProfit.toFixed(2),
    ];

    csvRows.push(totalsRow.join(","));

    // Create and download the CSV file
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    const startDate =
      dateRange?.startDate?.toLocaleDateString().replace(/\//g, "-") || "all";
    const endDate =
      dateRange?.endDate?.toLocaleDateString().replace(/\//g, "-") || "present";
    link.setAttribute(
      "download",
      `lorry-performance-${lorryName}-${startDate}-to-${endDate}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto">
      <div className="flex justify-between">
        <div>
          <h2 className="text-xl font-bold mb-4">Lorry Performance Report</h2>
          <p className="mb-4 text-gray-600">
            Period: {dateRange?.startDate?.toLocaleDateString() || "All time"}{" "}
            to {dateRange?.endDate?.toLocaleDateString() || "Present"}
          </p>
        </div>

        {/* Lorry Selection */}
        <div className="mb-4">
          <label
            htmlFor="lorry-select"
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Select Lorry
          </label>
          <select
            id="lorry-select"
            value={selectedLorry}
            onChange={(e) => setSelectedLorry(e.target.value)}
            className="mt-1 w-full pl-3 pr-4 py-2 text-base text-gray-700 bg-white border border-gray-300 p-2 focus:outline-none rounded shadow-lg"
          >
            <option value="">-- Select a Lorry --</option>
            {lorryData.map((lorry) => (
              <option key={lorry.lorry_id} value={lorry.lorry_id}>
                {lorry.lorry_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Performance Table */}
      <div className="overflow-x-auto border border-gray-400 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {/* Product Details */}
              <th
                colSpan="3"
                className="px-2 py-2 bg-yellow-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Product Details
              </th>

              {/* Price Details */}
              <th
                colSpan="3"
                className="px-2 py-2 bg-blue-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Price Details
              </th>

              {/* Loading Data */}
              <th
                colSpan="2"
                className="px-2 py-2 bg-orange-200 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Loading
              </th>

              {/* Unloading Data */}
              <th
                colSpan="2"
                className="px-2 py-2 bg-orange-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Unloading
              </th>

              {/* Expiry Returns */}
              <th
                colSpan="2"
                className="px-2 py-2 bg-red-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Expiry Returns
              </th>

              {/* Empty Returns */}
              <th
                colSpan="2"
                className="px-2 py-2 bg-purple-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Empty Returns
              </th>

              {/* Financial Data */}
              <th
                colSpan="4"
                className="px-2 py-2 bg-green-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Sale Info
              </th>
            </tr>

            <tr className="bg-gray-50">
              {/* Product Details */}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Size
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Case of Bottles
              </th>

              {/* Price Details */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Unit Price
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Selling Price
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Profit Margin
              </th>

              {/* Loading Data */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Cases Loaded
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Bottles Loaded
              </th>

              {/* Unloading Data */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Cases Returned
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Bottles Returned
              </th>

              {/* Expiry Returns */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Expiry Bottles
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Expiry Value
              </th>

              {/* Empty Returns */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Empty Cases
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Empty Bottles
              </th>

              {/* Financial Data */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Units Sold
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Cases Sold 
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Sales Value
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Gross Profit
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {selectedLorry ? (
              lorryPerformanceData.length > 0 ? (
                lorryPerformanceData.map((item, index) => (
                  <tr
                    key={item.product_id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {/* Product Details */}
                    <td className="px-2 py-2 text-sm text-gray-900">
                      {item.size}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-center">
                      {item.case_of_bottle}
                    </td>

                    {/* Price Details */}
                    <td className="px-2 py-2 text-sm text-gray-900 text-center">
                      {item.unit_price.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-center">
                      {item.selling_price.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-center">
                      {item.profit_margin}
                    </td>

                    {/* Loading Data */}
                    <td className="px-2 py-2 text-sm text-blue-600 font-medium text-center">
                      {item.cases_loaded}
                    </td>
                    <td className="px-2 py-2 text-sm text-blue-600 font-medium text-center">
                      {item.bottles_loaded}
                    </td>

                    {/* Unloading Data */}
                    <td className="px-2 py-2 text-sm text-green-600 font-medium text-center">
                      {item.cases_returned}
                    </td>
                    <td className="px-2 py-2 text-sm text-green-600 font-medium text-center">
                      {item.bottles_returned}
                    </td>

                    {/* Expiry Returns */}
                    <td className="px-2 py-2 text-sm text-red-600 font-medium text-center">
                      {item.expiry_bottles}
                    </td>
                    <td className="px-2 py-2 text-sm text-red-600 font-medium text-right">
                      {item.expiry_value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Empty Returns */}
                    <td className="px-2 py-2 text-sm text-purple-600 font-medium text-center">
                      {item.empty_cases}
                    </td>
                    <td className="px-2 py-2 text-sm text-purple-600 font-medium text-center">
                      {item.empty_bottles}
                    </td>

                    {/* Financial Data */}
                    <td className="px-2 py-2 text-sm text-gray-900 text-center">
                      {item.units_sold}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-center">
                        {(item.case_of_bottle === 16
                          ? (item.units_sold / (item.case_of_bottle * 2))
                          : (item.units_sold / item.case_of_bottle)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                    <td className="px-2 py-2 text-sm text-gray-900 text-right">
                      {item.sales_value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900 text-right">
                      {item.gross_profit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="17"
                    className="px-6 py-4 text-sm text-center text-gray-500"
                  >
                    No performance data found for this lorry.
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td
                  colSpan="17"
                  className="px-6 py-4 text-sm text-center text-gray-500"
                >
                  Please select a lorry to view performance data.
                </td>
              </tr>
            )}

            {/* Totals Row */}
            {lorryPerformanceData.length > 0 && (
              <tr className="bg-gray-100 font-medium">
                <td
                  colSpan="6"
                  className="px-2 py-2 text-right text-sm text-gray-900"
                >
                  Totals:
                </td>
                <td className="px-2 py-2 text-sm text-blue-700 text-center">
                  {totals.totalLoadingCases}
                </td>
                <td className="px-2 py-2 text-sm text-blue-700 text-center">
                  {totals.totalLoadingBottles}
                </td>
                <td className="px-2 py-2 text-sm text-green-700 text-center">
                  {totals.totalUnloadingCases}
                </td>
                <td className="px-2 py-2 text-sm text-green-700 text-center">
                  {totals.totalUnloadingBottles}
                </td>
                <td className="px-2 py-2 text-sm text-red-700 text-center">
                  {totals.totalExpiryBottles}
                </td>
                <td className="px-2 py-2 text-sm text-red-700 text-right">
                  {totals.totalExpiryValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-2 py-2 text-sm text-purple-700 text-center">
                  {totals.totalEmptyCases}
                </td>
                <td className="px-2 py-2 text-sm text-purple-700 text-center">
                  {totals.totalEmptyBottles}
                </td>
                <td className="px-2 py-2 text-sm text-gray-900 text-center">
                  {totals.totalSoldUnits}
                </td>
                <td className="px-2 py-2 text-sm text-gray-900 text-center">
                    {totals.totalSoldCases.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                <td className="px-2 py-2 text-sm text-gray-900 text-right">
                  {totals.totalSalesValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-2 py-2 text-sm text-gray-900 text-right">
                  {totals.totalProfit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )}
            {/* Net Income Row (Sales - Expiry) */}
            {lorryPerformanceData.length > 0 && (
              <tr className="bg-gray-200 font-medium">
                <td
                  colSpan="14"
                  className="px-2 py-2 text-right text-sm text-gray-900"
                >
                  Net Income (Sales - Expiry):
                </td>
                <td
                  colSpan="1"
                  className="px-2 py-2 text-sm text-red-700 text-right"
                >
                  -
                  {totals.totalExpiryValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  colSpan="1"
                  className="px-2 py-2 text-sm text-green-700 text-right"
                >
                  +
                  {totals.totalSalesValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  colSpan="2"
                  className="px-2 py-2 text-sm text-gray-900 font-bold text-right"
                >
                  ={" "}
                  {(
                    totals.totalSalesValue - totals.totalExpiryValue
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Export buttons */}
      {lorryPerformanceData.length > 0 && (
        <div className="mt-4 flex space-x-4">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Print Report
          </button>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Download CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default LorryPerformance;
