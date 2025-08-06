/*
  Configuration Header for Smart Inventory Palette
  PlatformIO Version
  
  This file contains all configuration constants and pin definitions
  Create this file in the include/ folder of your PlatformIO project
*/

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// PIN DEFINITIONS
// ============================================================================

// HX711 Load Cell Amplifier
#define HX711_DOUT_PIN 2    // Data output pin
#define HX711_SCK_PIN  4    // Clock pin

// Display pins (I2C - built into ESP32)
// SDA = GPIO 21 (default)
// SCL = GPIO 22 (default)

// Future expansion pins (for Phase 2)
#define NFC_SDA_PIN    5    // NFC SPI chip select
#define NFC_SCK_PIN    18   // NFC SPI clock
#define NFC_MOSI_PIN   23   // NFC SPI data out
#define NFC_MISO_PIN   19   // NFC SPI data in
#define NFC_RST_PIN    22   // NFC reset pin

#define LED_RED_PIN    12   // Red status LED
#define LED_GREEN_PIN  13   // Green status LED  
#define LED_BLUE_PIN   14   // Blue status LED
#define BUZZER_PIN     27   // Buzzer PWM pin
#define BUTTON_PIN     0    // Calibration button

// ============================================================================
// DISPLAY CONFIGURATION
// ============================================================================
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64
#define OLED_RESET      -1    // Reset pin (-1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS  0x3C  // I2C address for SSD1306

// ============================================================================
// SERIAL COMMUNICATION
// ============================================================================
#define SERIAL_BAUD_RATE 115200

// ============================================================================
// TIMING CONFIGURATION
// ============================================================================
#define READING_INTERVAL     100    // Weight reading interval (ms) - 10Hz
#define DISPLAY_INTERVAL     250    // Display update interval (ms) - 4Hz
#define HEARTBEAT_INTERVAL   5000   // System heartbeat check (ms)

// ============================================================================
// WEIGHT SYSTEM CONFIGURATION
// ============================================================================

// Calibration constants (MUST BE CALIBRATED FOR YOUR SETUP!)
// These are example values - you MUST calibrate your own system!
extern long TARE_OFFSET;        // Zero point offset (set during calibration)
extern float SCALE_FACTOR;      // Scale factor (set during calibration)

// Weight processing parameters
#define FILTER_SAMPLES       10     // Number of samples for moving average filter
#define STABILITY_THRESHOLD  0.05   // Weight stability threshold (kg)
#define MIN_WEIGHT_THRESHOLD 0.05   // Minimum weight to consider valid (kg)

// Bottle calculation
#define BOTTLE_WEIGHT        0.1    // Weight per bottle (kg) - adjust for your bottles
#define MAX_BOTTLES          200    // Maximum bottles (20kg / 0.1kg)

// HX711 specific settings
#define HX711_GAIN          128     // HX711 gain setting (128 for channel A)
#define HX711_SAMPLES       1       // Number of samples per reading

// ============================================================================
// SYSTEM LIMITS
// ============================================================================
#define MAX_WEIGHT          20.0    // Maximum weight capacity (kg)
#define MIN_WEIGHT          0.0     // Minimum weight (kg)
#define WEIGHT_RESOLUTION   0.01    // Weight resolution (kg)

// ============================================================================
// ERROR HANDLING
// ============================================================================
#define MAX_READING_ERRORS  10      // Maximum consecutive reading errors
#define ERROR_RECOVERY_TIME 5000    // Time between error recovery attempts (ms)

// ============================================================================
// CALIBRATION SETTINGS
// ============================================================================
#define CALIBRATION_SAMPLES 20      // Number of samples for calibration
#define TARE_SAMPLES       20      // Number of samples for taring

// ============================================================================
// FUTURE FEATURES (Phase 2+)
// ============================================================================

// NFC Configuration
#define NFC_FREQUENCY      13560000 // NFC frequency (Hz)
#define NFC_READ_TIMEOUT   100      // NFC read timeout (ms)

// WiFi Configuration (Phase 3)
#define WIFI_SSID          "YourWiFiNetwork"
#define WIFI_PASSWORD      "YourPassword"
#define WIFI_TIMEOUT       10000    // WiFi connection timeout (ms)

// Cloud Configuration (Phase 3)
#define API_ENDPOINT       "https://your-api.com"
#define MQTT_BROKER        "your-mqtt-broker.com"
#define MQTT_PORT          8883

// ============================================================================
// DEBUG CONFIGURATION
// ============================================================================
#define DEBUG_ENABLED      1        // Enable debug output (1=on, 0=off)
#define DEBUG_WEIGHT       1        // Debug weight readings
#define DEBUG_TIMING       0        // Debug timing information
#define DEBUG_MEMORY       0        // Debug memory usage

// Debug macros
#if DEBUG_ENABLED
  #define DEBUG_PRINT(x)   Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
  #define DEBUG_PRINTF(fmt, ...) Serial.printf(fmt, ##__VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(fmt, ...)
#endif

// ============================================================================
// HARDWARE FEATURE FLAGS
// ============================================================================
#define ENABLE_DISPLAY     1        // Enable OLED display
#define ENABLE_SERIAL      1        // Enable serial communication
#define ENABLE_FILTERING   1        // Enable weight filtering
#define ENABLE_STABILITY   1        // Enable stability detection

// Phase 2 features (set to 0 for Phase 1)
#define ENABLE_NFC         0        // Enable NFC reader
#define ENABLE_LEDS        0        // Enable status LEDs
#define ENABLE_BUZZER      0        // Enable audio feedback

// Phase 3 features (set to 0 for Phases 1-2)
#define ENABLE_WIFI        0        // Enable WiFi connectivity
#define ENABLE_CLOUD       0        // Enable cloud communication
#define ENABLE_OTA         0        // Enable over-the-air updates

// ============================================================================
// VERSION INFORMATION
// ============================================================================
#define FIRMWARE_VERSION   "1.0.0"
#define HARDWARE_VERSION   "1.0"
#define BUILD_DATE         __DATE__
#define BUILD_TIME         __TIME__

// ============================================================================
// SYSTEM IDENTIFICATION
// ============================================================================
#define DEVICE_NAME        "Smart_Palette"
#define DEVICE_MODEL       "SP-1000"
#define MANUFACTURER       "Zenden Solutions"

#endif // CONFIG_H