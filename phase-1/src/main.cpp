#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HX711.h>
#include "config.h"

// Global objects
HX711 scale;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Calibration values - MUST BE CALIBRATED!
long TARE_OFFSET = 0;
float SCALE_FACTOR = 1.0;

// Measurement variables
float current_weight = 0.0;
float filtered_weight = 0.0;
int bottle_count = 0;
bool is_stable = false;

// Timing variables
unsigned long last_reading = 0;
unsigned long last_display = 0;

// Filter array
float weight_readings[FILTER_SAMPLES];
int reading_index = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("====================================");
    Serial.println("Smart Inventory Palette - Phase 1");
    Serial.println("Weight Measurement System");
    Serial.println("====================================");
    
    // Initialize display
    if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println("ERROR: Display not found!");
        Serial.println("Try changing SCREEN_ADDRESS to 0x3D in config.h");
        while (true) delay(1000);
    }
    
    // Show startup screen
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Smart Palette v1.0");
    display.println("Initializing...");
    display.display();
    
    Serial.println("Display initialized successfully");
    
    // Initialize HX711
    scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
    
    if (scale.is_ready()) {
        Serial.println("HX711 initialized successfully");
        display.println("HX711: OK");
        display.display();
    } else {
        Serial.println("ERROR: HX711 not responding!");
        display.println("HX711: ERROR");
        display.display();
        while (true) delay(1000);
    }
    
    // Set calibration (will be updated during calibration)
    scale.set_scale(SCALE_FACTOR);
    scale.set_offset(TARE_OFFSET);
    
    // Initialize filter array
    for (int i = 0; i < FILTER_SAMPLES; i++) {
        weight_readings[i] = 0.0;
    }
    
    Serial.println("Setup complete!");
    Serial.println("Commands: 't'=tare, 'c'=calibrate, 'r'=raw readings");
    
    delay(2000);
}

void loop() {
    unsigned long now = millis();
    
    // Handle serial commands
    if (Serial.available()) {
        handleCommands();
    }
    
    // Read weight
    if (now - last_reading >= READING_INTERVAL) {
        readWeight();
        last_reading = now;
    }
    
    // Update display
    if (now - last_display >= DISPLAY_INTERVAL) {
        updateDisplay();
        last_display = now;
    }
}

void readWeight() {
    if (!scale.is_ready()) return;
    
    // Get weight reading
    current_weight = scale.get_units(1);
    
    // Handle negative weights
    if (current_weight < 0) current_weight = 0;
    
    // Apply moving average filter
    weight_readings[reading_index] = current_weight;
    reading_index = (reading_index + 1) % FILTER_SAMPLES;
    
    // Calculate filtered weight
    float sum = 0;
    for (int i = 0; i < FILTER_SAMPLES; i++) {
        sum += weight_readings[i];
    }
    filtered_weight = sum / FILTER_SAMPLES;
    
    // Check stability
    float max_diff = 0;
    for (int i = 0; i < FILTER_SAMPLES; i++) {
        float diff = abs(weight_readings[i] - filtered_weight);
        if (diff > max_diff) max_diff = diff;
    }
    is_stable = (max_diff < STABILITY_THRESHOLD);
    
    // Calculate bottle count
    if (filtered_weight > 0.05) {
        bottle_count = (int)(filtered_weight / BOTTLE_WEIGHT);
    } else {
        bottle_count = 0;
        filtered_weight = 0;
    }
    
    // Print to serial
    Serial.printf("Weight: %.2f kg | Bottles: %d | Stable: %s\n", 
                  filtered_weight, bottle_count, is_stable ? "YES" : "NO");
}

void updateDisplay() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    // Title
    display.setCursor(0, 0);
    display.println("Smart Palette v1.0");
    display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
    
    // Weight (large text)
    display.setCursor(0, 15);
    display.print("Weight:");
    display.setTextSize(2);
    display.setCursor(0, 25);
    display.printf("%.2f kg", filtered_weight);
    
    // Bottle count
    display.setTextSize(1);
    display.setCursor(0, 45);
    display.printf("Bottles: ~%d", bottle_count);
    
    // Status
    display.setCursor(0, 55);
    display.print("Status: ");
    if (is_stable) {
        display.print("Ready");
        display.fillCircle(120, 58, 3, SSD1306_WHITE);
    } else {
        display.print("Measuring");
        display.drawCircle(120, 58, 3, SSD1306_WHITE);
    }
    
    display.display();
}

void handleCommands() {
    char cmd = Serial.read();
    while (Serial.available()) Serial.read(); // Clear buffer
    
    switch (cmd) {
        case 't':
        case 'T':
            Serial.println("Taring scale...");
            scale.tare(10);
            Serial.println("Scale tared!");
            break;
            
        case 'c':
        case 'C':
            calibrateScale();
            break;
            
        case 'r':
        case 'R':
            showRawReadings();
            break;
            
        default:
            Serial.println("Commands: t=tare, c=calibrate, r=raw");
            break;
    }
}

void calibrateScale() {
    Serial.println("====================================");
    Serial.println("CALIBRATION PROCESS");
    Serial.println("====================================");
    
    // Step 1: Tare
    Serial.println("Step 1: Remove all weight, press Enter");
    while (!Serial.available()) delay(100);
    Serial.read();
    
    scale.tare(20);
    long tare = scale.get_offset();
    Serial.printf("Tare: %ld\n", tare);
    
    // Step 2: Known weight
    Serial.println("Step 2: Place known weight (kg):");
    while (!Serial.available()) delay(100);
    float known_weight = Serial.parseFloat();
    while (Serial.available()) Serial.read();
    
    Serial.printf("Using: %.2f kg\n", known_weight);
    Serial.println("Press Enter when stable...");
    while (!Serial.available()) delay(100);
    Serial.read();
    
    // Take reading
    long reading = 0;
    for (int i = 0; i < 20; i++) {
        reading += scale.read();
        delay(100);
    }
    reading /= 20;
    
    // Calculate scale factor
    float new_scale = (reading - tare) / known_weight;
    
    Serial.println("====================================");
    Serial.printf("Tare Offset: %ld\n", tare);
    Serial.printf("Scale Factor: %.1f\n", new_scale);
    Serial.println("====================================");
    Serial.println("Update these in your code:");
    Serial.printf("TARE_OFFSET = %ld;\n", tare);
    Serial.printf("SCALE_FACTOR = %.1f;\n", new_scale);
    Serial.println("====================================");
    
    // Apply temporarily
    scale.set_scale(new_scale);
    scale.set_offset(tare);
    
    Serial.println("Calibration applied temporarily");
}

void showRawReadings() {
    Serial.println("Raw readings (press any key to stop):");
    while (!Serial.available()) {
        long raw = scale.read();
        float weight = scale.get_units();
        Serial.printf("Raw: %ld | Weight: %.3f kg\n", raw, weight);
        delay(500);
    }
    Serial.read();
    Serial.println("Stopped.");
}