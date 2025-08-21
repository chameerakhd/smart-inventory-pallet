#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "C_4G"
#define WIFI_PASSWORD "chameera1234"

// API Configuration
// #define API_BASE_URL "https:///api"
// #define API_KEY "your-api-key"

// Hardware Configuration
#define PALETTE_ID "PAL_001"
#define BOTTLE_WEIGHT 0.1f
#define STABILITY_THRESHOLD 0.05f
#define FILTER_SAMPLES 10

// Pin Definitions
#define HX711_1_DT    4
#define HX711_1_SCK   5
#define HX711_2_DT    16
#define HX711_2_SCK   17
#define PN532_SDA     21
#define PN532_SCL     22
#define BLUE_LED      25
#define GREEN_LED     26
#define RED_LED       27
#define BUILTIN_LED   2

// Display Configuration
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SCREEN_ADDRESS 0x3C

// Timing Constants
#define DOUBLE_TAP_TIME   2000
#define WEIGHT_READ_DELAY 100
#define API_SEND_INTERVAL 5000
#define DISPLAY_UPDATE    1000

#endif