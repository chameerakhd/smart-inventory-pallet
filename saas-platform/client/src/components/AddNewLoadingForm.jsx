import React, { useState, useEffect } from "react";
import axios from "axios";

// Updated API URL handling
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const ESP32LoadingForm = ({ onLoadingAdded, inventoryData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lorries, setLorries] = useState([]);
  const [smartPalettes, setSmartPalettes] = useState([]);
  const [selectedPalette, setSelectedPalette] = useState(null);
  const [paletteData, setPaletteData] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loadedLorries, setLoadedLorries] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    lorry_id: "",
    palette_id: "",
    loading_date: new Date().toISOString().split("T")[0],
    loading_time: new Date().toTimeString().split(" ")[0],
    loaded_by: "",
    status: "In Progress",
  });

  // Transaction state for ESP32 loading
  const [currentTransaction, setCurrentTransaction] = useState({
    initial_weight: 0,
    current_weight: 0,
    weight_change: 0,
    bottle_count_change: 0,
    transaction_type: "LOAD", // LOAD or UNLOAD
    vehicle_nfc_id: null,
    is_stable: false,
    last_update: null,
  });

  // Fetch initial data
  useEffect(() => {
    fetchLorries();
    fetchSmartPalettes();
    fetchActiveLoadingTransactions();
  }, []);

  const fetchLorries = async () => {
    try {
      const response = await axios.get(`${API_URL}/lorries`);
      setLorries(response.data);
    } catch (err) {
      console.error("Failed to fetch lorries:", err);
    }
  };

  // NEW: Fetch available smart palettes
  const fetchSmartPalettes = async () => {
    try {
      const response = await axios.get(`${API_URL}/smart-palettes`);
      setSmartPalettes(response.data);
    } catch (err) {
      console.error("Failed to fetch smart palettes:", err);
    }
  };

  const fetchActiveLoadingTransactions = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/loading-transactions?status=active`
      );
      const loadedLorriesMap = {};
      response.data.forEach((transaction) => {
        if (transaction.status !== "Unloaded") {
          loadedLorriesMap[transaction.lorry_id] = transaction;
        }
      });
      setLoadedLorries(loadedLorriesMap);
    } catch (err) {
      console.error("Failed to fetch active loading transactions:", err);
    }
  };

  // NEW: Get real-time data from specific palette
  const fetchPaletteData = async (paletteId) => {
    try {
      const response = await axios.get(`${API_URL}/smart-palettes/${paletteId}/current-data`);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch palette data:", err);
      return null;
    }
  };

  // NEW: Start monitoring palette data
  const startPaletteMonitoring = async (paletteId) => {
    if (!paletteId) return;

    setIsMonitoring(true);
    setError(null);

    try {
      // Get initial palette state
      const initialData = await fetchPaletteData(paletteId);
      if (initialData) {
        setPaletteData(initialData);
        setCurrentTransaction({
          initial_weight: initialData.current_weight,
          current_weight: initialData.current_weight,
          weight_change: 0,
          bottle_count_change: 0,
          transaction_type: "LOAD",
          vehicle_nfc_id: initialData.last_nfc_id,
          is_stable: initialData.is_stable,
          last_update: new Date().toISOString(),
        });
      }

      // Start polling for updates every 2 seconds
      const interval = setInterval(async () => {
        const currentData = await fetchPaletteData(paletteId);
        if (currentData && paletteData) {
          const weightChange = currentData.current_weight - currentTransaction.initial_weight;
          const bottleChange = Math.round(weightChange / 0.1); // Assuming 100ml bottles = 0.1kg each
          
          setCurrentTransaction(prev => ({
            ...prev,
            current_weight: currentData.current_weight,
            weight_change: weightChange,
            bottle_count_change: Math.abs(bottleChange),
            transaction_type: weightChange > 0 ? "LOAD" : "UNLOAD",
            vehicle_nfc_id: currentData.last_nfc_id,
            is_stable: currentData.is_stable,
            last_update: new Date().toISOString(),
          }));

          setPaletteData(currentData);
        }
      }, 2000);

      // Store interval for cleanup
      return interval;
    } catch (err) {
      console.error("Error starting palette monitoring:", err);
      setError("Failed to connect to smart palette");
      setIsMonitoring(false);
    }
  };

  // NEW: Stop monitoring palette
  const stopPaletteMonitoring = (interval) => {
    if (interval) {
      clearInterval(interval);
    }
    setIsMonitoring(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "lorry_id" && value) {
      if (loadedLorries[value]) {
        setError(
          `This lorry already has an active loading (ID: ${loadedLorries[value].loading_id}). It must be unloaded before creating a new loading.`
        );
        setFormData({ ...formData, [name]: "" });
        return;
      } else {
        setError(null);
      }
    }

    // NEW: Handle palette selection
    if (name === "palette_id" && value) {
      const palette = smartPalettes.find(p => p.palette_id === value);
      setSelectedPalette(palette);
      
      // Start monitoring the selected palette
      startPaletteMonitoring(value).then(interval => {
        // Store interval for cleanup
        setSelectedPalette(prev => ({ ...prev, monitoringInterval: interval }));
      });
    }

    setFormData({ ...formData, [name]: value });
  };

  // NEW: Handle NFC card detection
  const handleNFCCardDetected = (nfcId) => {
    // Find lorry by NFC ID
    const lorry = lorries.find(l => l.nfc_card_id === nfcId);
    if (lorry) {
      setFormData(prev => ({ ...prev, lorry_id: lorry.lorry_id }));
      setError(null);
    } else {
      setError(`Unknown NFC card detected: ${nfcId}. Please register this card first.`);
    }
  };

  // NEW: Validate ESP32 transaction
  const validateESP32Transaction = () => {
    if (!formData.lorry_id || !formData.palette_id || !formData.loaded_by) {
      setError("Please fill in all required fields and select a palette");
      return false;
    }

    if (!currentTransaction.is_stable) {
      setError("Please wait for weight reading to stabilize before confirming");
      return false;
    }

    if (Math.abs(currentTransaction.weight_change) < 0.5) {
      setError("No significant weight change detected. Please load/unload items on the palette.");
      return false;
    }

    if (loadedLorries[formData.lorry_id]) {
      setError("This lorry already has an active loading. It must be unloaded before creating a new loading.");
      return false;
    }

    return true;
  };

  // Show confirmation dialog
  const handleShowConfirmation = (e) => {
    e.preventDefault();
    if (validateESP32Transaction()) {
      setError(null);
      setShowConfirmation(true);
    }
  };

  // NEW: Submit ESP32 loading transaction
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare ESP32 loading data
      const esp32LoadingData = {
        ...formData,
        palette_id: selectedPalette.palette_id,
        initial_weight: currentTransaction.initial_weight,
        final_weight: currentTransaction.current_weight,
        weight_change: currentTransaction.weight_change,
        bottle_count_change: currentTransaction.bottle_count_change,
        transaction_type: currentTransaction.transaction_type,
        vehicle_nfc_id: currentTransaction.vehicle_nfc_id,
        timestamp: currentTransaction.last_update,
        device_status: paletteData?.device_status || "online",
      };

      // Send to new ESP32 loading endpoint
      await axios.post(`${API_URL}/esp32-loading-transactions`, esp32LoadingData);

      setSuccess(true);
      setShowConfirmation(false);

      // Reset form
      setFormData({
        lorry_id: "",
        palette_id: "",
        loading_date: new Date().toISOString().split("T")[0],
        loading_time: new Date().toTimeString().split(" ")[0],
        loaded_by: "",
        status: "In Progress",
      });

      // Stop monitoring
      if (selectedPalette?.monitoringInterval) {
        stopPaletteMonitoring(selectedPalette.monitoringInterval);
      }

      // Reset transaction state
      setCurrentTransaction({
        initial_weight: 0,
        current_weight: 0,
        weight_change: 0,
        bottle_count_change: 0,
        transaction_type: "LOAD",
        vehicle_nfc_id: null,
        is_stable: false,
        last_update: null,
      });

      setSelectedPalette(null);
      setPaletteData(null);

      if (onLoadingAdded) {
        onLoadingAdded();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error creating ESP32 loading transaction:", err);
      setError(err.response?.data?.message || "Failed to create loading transaction");
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  // Cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  // Get selected lorry details
  const selectedLorry = lorries.find(
    (lorry) => lorry.lorry_id === parseInt(formData.lorry_id)
  );

  // Cleanup monitoring on unmount
  useEffect(() => {
    return () => {
      if (selectedPalette?.monitoringInterval) {
        stopPaletteMonitoring(selectedPalette.monitoringInterval);
      }
    };
  }, [selectedPalette]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Smart Palette Loading System</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ESP32 loading transaction created successfully!
        </div>
      )}

      {/* NEW: Real-time Palette Status */}
      {selectedPalette && paletteData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Live Palette Data</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Current Weight</p>
              <p className="text-xl font-bold text-blue-600">
                {currentTransaction.current_weight.toFixed(2)} kg
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Weight Change</p>
              <p className={`text-xl font-bold ${
                currentTransaction.weight_change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentTransaction.weight_change > 0 ? '+' : ''}
                {currentTransaction.weight_change.toFixed(2)} kg
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Estimated Bottles</p>
              <p className="text-xl font-bold text-purple-600">
                {currentTransaction.bottle_count_change}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-sm font-bold ${
                currentTransaction.is_stable ? 'text-green-600' : 'text-orange-600'
              }`}>
                {currentTransaction.is_stable ? 'Stable' : 'Measuring...'}
              </p>
            </div>
          </div>
          
          {currentTransaction.vehicle_nfc_id && (
            <div className="mt-3 p-2 bg-green-100 rounded">
              <p className="text-sm text-green-800">
                🚛 Vehicle NFC detected: {currentTransaction.vehicle_nfc_id}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Confirm ESP32 Loading Transaction</h3>

            <div className="mb-4">
              <p className="font-semibold">Transaction Details:</p>
              <p>Lorry: {selectedLorry ? `${selectedLorry.lorry_number} - ${selectedLorry.driver_name}` : ""}</p>
              <p>Palette: {selectedPalette?.palette_name || selectedPalette?.palette_id}</p>
              <p>Loaded By: {formData.loaded_by}</p>
              <p>Date: {formData.loading_date}</p>
              <p>Time: {formData.loading_time}</p>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="font-semibold mb-2">Measured Data:</p>
              <p>Weight Change: <span className="font-mono">{currentTransaction.weight_change.toFixed(2)} kg</span></p>
              <p>Estimated Bottles: <span className="font-mono">{currentTransaction.bottle_count_change}</span></p>
              <p>Transaction Type: <span className="font-mono">{currentTransaction.transaction_type}</span></p>
              {currentTransaction.vehicle_nfc_id && (
                <p>Vehicle NFC: <span className="font-mono">{currentTransaction.vehicle_nfc_id}</span></p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelConfirmation}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-[#0fb493] hover:bg-[#036c57] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleShowConfirmation}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* NEW: Smart Palette Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Smart Palette*
            </label>
            <select
              name="palette_id"
              value={formData.palette_id}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Smart Palette</option>
              {smartPalettes.map((palette) => (
                <option key={palette.palette_id} value={palette.palette_id}>
                  {palette.palette_name || `Palette ${palette.palette_id}`} - 
                  {palette.location} ({palette.status})
                </option>
              ))}
            </select>
          </div>

          {/* Lorry Selection - Modified to show NFC integration */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Lorry* (Auto-detected via NFC)
            </label>
            <select
              name="lorry_id"
              value={formData.lorry_id}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Tap NFC card or select manually</option>
              {lorries.map((lorry) => {
                const isLoaded = loadedLorries[lorry.lorry_id];
                return (
                  <option
                    key={lorry.lorry_id}
                    value={lorry.lorry_id}
                    disabled={isLoaded}
                  >
                    {lorry.lorry_number} - {lorry.driver_name}
                    {isLoaded ? " (Already Loaded)" : ""}
                    {lorry.nfc_card_id ? ` (NFC: ${lorry.nfc_card_id})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Loaded By */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Loaded By*
            </label>
            <input
              type="text"
              name="loaded_by"
              value={formData.loaded_by}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          {/* Loading Date */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Loading Date
            </label>
            <input
              type="date"
              name="loading_date"
              value={formData.loading_date}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Loading Time */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Loading Time
            </label>
            <input
              type="time"
              name="loading_time"
              value={formData.loading_time}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Status - Updated for ESP32 */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* NEW: Instructions for ESP32 Usage */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">📋 Loading Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Select the smart palette you want to use</li>
            <li>Tap the vehicle's NFC card on the palette reader (or select manually)</li>
            <li>Enter the loader's name</li>
            <li>Start loading/unloading items on the palette</li>
            <li>Wait for the weight reading to stabilize</li>
            <li>Click "Confirm Transaction" when ready</li>
          </ol>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#0fb493] hover:bg-[#036c57] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading || !currentTransaction.is_stable || !selectedPalette}
          >
            {loading ? "Processing..." : "Confirm Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ESP32LoadingForm;