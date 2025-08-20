import React, { useRef } from "react";

const ReportsOverview = ({
  products,
  lorryData,
  loadingTransactions,
  unloadingTransactions,
  salesData,
  expiryReturns,
  stockData,
  dateRange,
}) => {
  const printRef = useRef();

  // Process all data into a consolidated report
  const processConsolidatedData = () => {
    if (!products.length) return [];

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
        case_price: product.unit_price * (product.bottles_per_case || 0),

        // Initialize lorry data (will be populated)
        lorry_data: {},

        // Initialize current stock (will be updated)
        current_stock_case: 0,
        current_stock_bottles: 0,

        // Initialize sales data (will be updated)
        total_bottles: 0,
        total_value: 0,
        no_of_sale_units: 0,
        sale_income: 0,
        gross_profit: 0,
      });
    });

    // Process lorry data
    const lorryIds = lorryData.map((lorry) => lorry.lorry_id);

    // Initialize lorry data structure for each product
    productMap.forEach((productData) => {
      lorryIds.forEach((lorryId) => {
        const lorryNumber =
          lorryData.find((l) => l.lorry_id === lorryId)?.lorry_number ||
          `Lorry ${lorryId}`;

        productData.lorry_data[lorryId] = {
          lorry_number: lorryNumber,
          cases_loaded: 0,
          bottles_loaded: 0,
          cases_returned: 0,
          bottles_returned: 0,
        };
      });
    });

    // Process loading transactions
    loadingTransactions.forEach((transaction) => {
      if (transaction.loadingDetails && transaction.loadingDetails.length > 0) {
        transaction.loadingDetails.forEach((detail) => {
          const productId = detail.product_id;
          const lorryId = transaction.lorry_id;

          if (productMap.has(productId) && lorryId) {
            const productData = productMap.get(productId);

            if (productData.lorry_data[lorryId]) {
              productData.lorry_data[lorryId].cases_loaded +=
                detail.cases_loaded || 0;
              productData.lorry_data[lorryId].bottles_loaded +=
                detail.bottles_loaded || 0;
            }
          }
        });
      }
    });

    // Process unloading transactions
    unloadingTransactions.forEach((transaction) => {
      if (
        transaction.unloadingDetails &&
        transaction.unloadingDetails.length > 0
      ) {
        transaction.unloadingDetails.forEach((detail) => {
          const productId = detail.product_id;
          const lorryId = transaction.lorry_id;

          if (productMap.has(productId) && lorryId) {
            const productData = productMap.get(productId);

            if (productData.lorry_data[lorryId]) {
              productData.lorry_data[lorryId].cases_returned +=
                detail.cases_returned || 0;
              productData.lorry_data[lorryId].bottles_returned +=
                detail.bottles_returned || 0;
            }
          }
        });
      }
    });

    // Process stock data
    stockData.forEach((stockItem) => {
      const productId = stockItem.product_id;

      if (productMap.has(productId)) {
        const productData = productMap.get(productId);
        productData.current_stock_case = stockItem.cases_qty || 0;
        productData.current_stock_bottles = stockItem.bottles_qty || 0;
        productData.total_bottles = stockItem.total_bottles || 0;
        productData.total_value = stockItem.total_value || 0;
      }
    });

    // Process sales data
    salesData.forEach((saleItem) => {
      const productId = saleItem.product_id;

      if (productMap.has(productId)) {
        const productData = productMap.get(productId);
        productData.no_of_sale_units =
          (productData.no_of_sale_units || 0) + (saleItem.units_sold || 0);
        productData.sale_income =
          (productData.sale_income || 0) + (saleItem.sales_income || 0);
        productData.gross_profit =
          (productData.gross_profit || 0) + (saleItem.gross_profit || 0);
      }
    });

    // Convert Map to Array
    const resultArray = Array.from(productMap.values());

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
    return resultArray.sort((a, b) => {
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
  };

  const consolidatedData = processConsolidatedData();

  // Get unique lorry IDs from lorry data
  const lorryIds = lorryData.map((lorry) => lorry.lorry_id);

  // Download CSV function
  const downloadCSV = () => {
    if (consolidatedData.length === 0) {
      alert("No data available to export");
      return;
    }

    // Create CSV header
    let headers = [
      "Size",
      "Brand",
      "Case of Bottles",
      "Unit Price",
      "Selling Price",
      "Profit Margin",
    ];

    // Add lorry headers
    lorryIds.forEach((lorryId) => {
      const lorryNumber =
        lorryData.find((l) => l.lorry_id === lorryId)?.lorry_number ||
        `Lorry ${lorryId}`;
      headers.push(
        `${lorryNumber} Loading Cases`,
        `${lorryNumber} Loading Bottles`,
        `${lorryNumber} Unloading Cases`,
        `${lorryNumber} Unloading Bottles`
      );
    });

    // Add remaining headers
    headers = headers.concat([
      "Current Stock Cases",
      "Current Stock Bottles",
      "Total Bottles",
      "Total Value",
      "No of Sale Units",
      "Sale Income",
    ]);

    // Convert data to CSV rows
    const csvRows = [];
    csvRows.push(headers.join(","));

    consolidatedData.forEach((item) => {
      const row = [
        `"${item.size}"`,
        `"${item.product_name}"`,
        item.case_of_bottle,
        item.unit_price,
        item.selling_price,
        item.profit_margin,
      ];

      // Add lorry data
      lorryIds.forEach((lorryId) => {
        const lorryInfo = item.lorry_data[lorryId] || {
          cases_loaded: 0,
          bottles_loaded: 0,
          cases_returned: 0,
          bottles_returned: 0,
        };

        row.push(
          lorryInfo.cases_loaded,
          lorryInfo.bottles_loaded,
          lorryInfo.cases_returned,
          lorryInfo.bottles_returned
        );
      });

      // Add remaining data
      row.push(
        item.current_stock_case,
        item.current_stock_bottles,
        item.total_bottles,
        item.total_value,
        item.no_of_sale_units,
        item.sale_income
      );

      csvRows.push(row.join(","));
    });

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
      `inventory-report-${startDate}-to-${endDate}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    const content = printRef.current;
    const printWindow = window.open("", "", "height=600,width=800");

    printWindow.document.write("<html><head><title>Inventory Report</title>");

    // Add styles for printing
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { text-align: center; margin-bottom: 10px; }
        p { text-align: center; margin-bottom: 20px; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 4px; font-size: 12px; }
        thead tr:first-child th { background-color: #f0f0f0; }
        thead tr:nth-child(2) th { background-color: #f8f8f8; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    `);

    printWindow.document.write("</head><body>");
    printWindow.document.write("<h2>Consolidated Inventory Report</h2>");
    printWindow.document.write(
      `<p>Period: ${
        dateRange?.startDate?.toLocaleDateString() || "All time"
      } to ${dateRange?.endDate?.toLocaleDateString() || "Present"}</p>`
    );
    printWindow.document.write(content.innerHTML);
    printWindow.document.write("</body></html>");

    printWindow.document.close();
    printWindow.focus();

    // Add slight delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="mx-auto">
      <h2 className="text-xl font-bold mb-4">Consolidated Inventory Report</h2>
      <p className="mb-4 text-gray-600">
        Period: {dateRange?.startDate?.toLocaleDateString() || "All time"} to{" "}
        {dateRange?.endDate?.toLocaleDateString() || "Present"}
      </p>

      <div
        ref={printRef}
        className="overflow-x-auto border border-gray-400 rounded-lg shadow-sm"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {/* Product Details - Header */}
              <th
                colSpan="3"
                className="px-2 py-2 bg-yellow-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Product Details
              </th>

              {/* Price Details - Header */}
              <th
                colSpan="3"
                className="px-2 py-2 bg-blue-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Price Details
              </th>

              {/* Lorry Data - Headers */}
              {lorryIds.map((lorryId) => (
                <React.Fragment key={`lorry-header-${lorryId}`}>
                  <th
                    colSpan="2"
                    className="px-2 py-2 bg-orange-200 text-center text-xs font-medium text-gray-700 uppercase"
                  >
                    {lorryData.find((l) => l.lorry_id === lorryId)
                      ?.lorry_number || `Lorry ${lorryId}`}{" "}
                    Loading
                  </th>
                  <th
                    colSpan="2"
                    className="px-2 py-2 bg-orange-100 text-center text-xs font-medium text-gray-700 uppercase"
                  >
                    {lorryData.find((l) => l.lorry_id === lorryId)
                      ?.lorry_number || `Lorry ${lorryId}`}{" "}
                    Unloading
                  </th>
                </React.Fragment>
              ))}

              {/* Current Stock - Header */}
              <th
                colSpan="2"
                className="px-2 py-2 bg-blue-200 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Current Stock
              </th>

              {/* Financial Info - Header */}
              <th
                colSpan="5"
                className="px-2 py-2 bg-green-100 text-center text-xs font-medium text-gray-700 uppercase"
              >
                Financial Info
              </th>
            </tr>

            <tr className="bg-gray-50">
              {/* Product Details - Subheaders */}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Size
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Brand
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Case of Bottles
              </th>

              {/* Price Details - Subheaders */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Unit Price
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Selling Price
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Profit Margin
              </th>

              {/* Lorry Data - Subheaders */}
              {lorryIds.map((lorryId) => (
                <React.Fragment key={`lorry-subheader-${lorryId}`}>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Case
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Bottles
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Case
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Bottles
                  </th>
                </React.Fragment>
              ))}

              {/* Current Stock - Subheaders */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Case
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Bottles
              </th>

              {/* Financial Info - Subheaders */}
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Total Bottles
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Total Value
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                No of Sale Units
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Sale Income
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Gross Profit
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {consolidatedData.length > 0 ? (
              consolidatedData.map((item, index) => (
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

                  {/* Lorry Data */}
                  {lorryIds.map((lorryId) => {
                    const lorryInfo = item.lorry_data[lorryId] || {
                      cases_loaded: 0,
                      bottles_loaded: 0,
                      cases_returned: 0,
                      bottles_returned: 0,
                    };

                    return (
                      <React.Fragment
                        key={`lorry-data-${lorryId}-${item.product_id}`}
                      >
                        <td className="px-2 py-2 text-sm text-blue-600 font-medium text-center">
                          {lorryInfo.cases_loaded}
                        </td>
                        <td className="px-2 py-2 text-sm text-blue-600 font-medium text-center">
                          {lorryInfo.bottles_loaded}
                        </td>
                        <td className="px-2 py-2 text-sm text-green-600 font-medium text-center">
                          {lorryInfo.cases_returned}
                        </td>
                        <td className="px-2 py-2 text-sm text-green-600 font-medium text-center">
                          {lorryInfo.bottles_returned}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Current Stock */}
                  <td className="px-2 py-2 text-sm font-medium text-center">
                    {item.current_stock_case}
                  </td>
                  <td className="px-2 py-2 text-sm font-medium text-center">
                    {item.current_stock_bottles}
                  </td>

                  {/* Financial Info */}
                  <td className="px-2 py-2 text-sm text-gray-900 text-center">
                    {item.total_bottles.toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-right">
                    {item.total_value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-center">
                    {item.no_of_sale_units.toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900 text-right">
                    {item.sale_income.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-2 pr-4 py-2 text-sm text-gray-900 text-right">
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
                  colSpan={11 + lorryIds.length * 4}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No data available for the selected period
                </td>
              </tr>
            )}
            {consolidatedData.length > 0 && (
              <tr className="bg-gray-100 font-bold">
                <td
                  colSpan={6 + lorryIds.length * 4}
                  className="px-2 py-2 text-right text-sm"
                >
                  Totals:
                </td>
                <td className="px-2 py-2 text-sm text-center">
                  {consolidatedData
                    .reduce((total, item) => total + item.current_stock_case, 0)
                    .toLocaleString()}
                </td>
                <td className="px-2 py-2 text-sm text-center">
                  {consolidatedData
                    .reduce(
                      (total, item) => total + item.current_stock_bottles,
                      0
                    )
                    .toLocaleString()}
                </td>
                <td className="px-2 py-2 text-sm text-center">
                  {consolidatedData
                    .reduce((total, item) => total + item.total_bottles, 0)
                    .toLocaleString()}
                </td>
                <td className="px-2 py-2 text-sm text-right">
                  {consolidatedData
                    .reduce((total, item) => total + item.total_value, 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </td>
                <td className="px-2 py-2 text-sm text-center">
                  {consolidatedData
                    .reduce((total, item) => total + item.no_of_sale_units, 0)
                    .toLocaleString()}
                </td>
                <td className="px-2 py-2 text-sm text-right">
                  {consolidatedData
                    .reduce((total, item) => total + item.sale_income, 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </td>
                <td className="px-2 pr-4 py-2 text-sm text-right">
                  {consolidatedData
                    .reduce((total, item) => total + item.gross_profit, 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </td>
              </tr>
            )}
            {consolidatedData.length > 0 && (
              <tr className="bg-yellow-50 font-bold">
                <td
                  colSpan={12 + lorryIds.length * 4}
                  className="px-2 py-2 text-right text-sm"
                >
                  Total Expiry Value:
                </td>
                <td className="px-2 pr-4 py-2 text-sm text-red-600 text-right">
                  {expiryReturns?.summary?.totalExpiryValue?.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  ) || "0.00"}
                </td>
              </tr>
            )}
            {consolidatedData.length > 0 && (
              <tr className="bg-green-50 font-bold">
                <td
                  colSpan={12 + lorryIds.length * 4}
                  className="px-2 py-2 text-right text-sm"
                >
                  Net Sales Income (after Expiry):
                </td>
                <td className="px-2 pr-4 py-2 text-sm text-green-700 text-right">
                  {(
                    consolidatedData.reduce(
                      (total, item) => total + item.sale_income,
                      0
                    ) - (expiryReturns?.summary?.totalExpiryValue || 0)
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )}
            {/* {consolidatedData.length > 0 && (
              <tr className="bg-blue-50 font-bold">
                <td
                  colSpan={12 + lorryIds.length * 4}
                  className="px-2 py-2 text-right text-sm"
                >
                  Net Sales Income:
                </td>
                <td className="px-2 pr-4 py-2 text-sm text-blue-700 text-right">
                  {totalGrossProfit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )} */}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={downloadCSV}
          className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Export CSV
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Print Report
        </button>
      </div>
    </div>
  );
};

export default ReportsOverview;
