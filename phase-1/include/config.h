#ifndef CONFIG_H
#define CONFIG_H

// Pin definitions for your ESP32 board
#define HX711_DOUT_PIN 2    // Connected to D2
#define HX711_SCK_PIN  4    // Connected to D4

// Display settings (built-in OLED)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SCREEN_ADDRESS 0x3C  // Try 0x3D if 0x3C doesn't work

// Measurement settings
#define READING_INTERVAL 100     // 10Hz update rate
#define DISPLAY_INTERVAL 250     // 4Hz display update
#define FILTER_SAMPLES 10        // Moving average samples
#define STABILITY_THRESHOLD 0.05 // Weight stability (kg)
#define BOTTLE_WEIGHT 0.1        // Weight per bottle (kg)

// Calibration values (will be set during calibration)
extern long TARE_OFFSET;
extern float SCALE_FACTOR;

#endif