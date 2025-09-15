/*
  config.h - Configuration file for Smart Palette Phase 2
  Update these values according to your setup
*/

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// WiFi Configuration - UPDATE THESE VALUES
// ============================================================================
#define WIFI_SSID "YOUR_WIFI_NETWORK_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// ============================================================================
// MQTT Configuration - UPDATE THESE VALUES
// ============================================================================
#define MQTT_SERVER "192.168.1.100"        // Your MQTT broker IP address
#define MQTT_PORT 1883                     // Standard MQTT port
#define MQTT_CLIENT_ID "smart_palette_001" // Unique client ID
#define MQTT_USERNAME ""                   // Leave empty if no authentication
#define MQTT_PASSWORD ""                   // Leave empty if no authentication

// MQTT Topics
#define TOPIC_WEIGHT "palette/weight"
#define TOPIC_BOTTLES "palette/bottles"
#define TOPIC_STATUS "palette/status"
#define TOPIC_SYSTEM "palette/system"

// ============================================================================
// Hardware Pin Configuration
// ============================================================================
// Load Cell 1 (HX711_1)
#define HX711_1_DOUT_PIN 4
#define HX711_1_SCK_PIN 5

// Load Cell 2 (HX711_2)
#define HX711_2_DOUT_PIN 18
#define HX711_2_SCK_PIN 19

// Display (Built-in ESP32 OLED)
#define DISPLAY_SDA_PIN 21
#define DISPLAY_SCL_PIN 22
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// ============================================================================
// Calibration Values - UPDATE AFTER CALIBRATION
// ============================================================================
// Load Cell 1 Calibration
#define SCALE_FACTOR_1 1.0    // Update after calibration
#define TARE_OFFSET_1 0       // Update after calibration

// Load Cell 2 Calibration  
#define SCALE_FACTOR_2 1.0    // Update after calibration
#define TARE_OFFSET_2 0       // Update after calibration

// ============================================================================
// Measurement Configuration
// ============================================================================
#define BOTTLE_WEIGHT 1           // Weight of one bottle in kg (650g)
#define MIN_WEIGHT_THRESHOLD 0.1     // Minimum weight to consider (100g)
#define MAX_WEIGHT 20.0              // Maximum total weight (20kg)
#define STABILITY_THRESHOLD 0.05     // Weight stability threshold (50g)
#define FILTER_SAMPLES 10            // Moving average filter samples

// ============================================================================
// Timing Configuration (in milliseconds)
// ============================================================================
#define READING_INTERVAL 100         // Weight reading interval
#define DISPLAY_INTERVAL 500         // Display update interval
#define MQTT_INTERVAL 2000           // MQTT publish interval
#define WIFI_CHECK_INTERVAL 30000    // WiFi connection check interval
#define SERIAL_BAUD_RATE 115200      // Serial communication speed

#endif // CONFIG_H