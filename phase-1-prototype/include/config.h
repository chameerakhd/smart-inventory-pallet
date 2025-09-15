#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// PIN DEFINITIONS (Based on your wiring)
// ============================================================================
#define HX711_DOUT_PIN 2    // HX711 DT  -> ESP32 D4
#define HX711_SCK_PIN  4    // HX711 SCK -> ESP32 D5

// Built-in Display I2C pins (usually internal)
#define DISPLAY_SDA_PIN 21  // GPIO 21 (default I2C SDA)
#define DISPLAY_SCL_PIN 22  // GPIO 22 (default I2C SCL)

// Display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1    // Reset pin (-1 if sharing Arduino reset)
#define SCREEN_ADDRESS 0x3C // I2C address (try 0x3D if 0x3C doesn't work)

// ============================================================================
// MEASUREMENT SETTINGS
// ============================================================================
#define READING_INTERVAL     100    // Weight reading interval (ms) - 10Hz
#define DISPLAY_INTERVAL     250    // Display update interval (ms) - 4Hz
#define FILTER_SAMPLES       10     // Moving average filter samples
#define STABILITY_THRESHOLD  0.05   // Weight stability threshold (kg)
#define MIN_WEIGHT_THRESHOLD 0.05   // Minimum weight to consider (kg)
#define BOTTLE_WEIGHT        0.1    // Weight per bottle (kg) - adjust as needed

// ============================================================================
// CALIBRATION VALUES (Will be updated during calibration)
// ============================================================================
extern long TARE_OFFSET;
extern float SCALE_FACTOR;

// ============================================================================
// SYSTEM CONSTANTS
// ============================================================================
#define MAX_WEIGHT          20.0    // Maximum load cell capacity (kg)
#define SERIAL_BAUD_RATE    115200  // Serial communication speed

#endif // CONFIG_H