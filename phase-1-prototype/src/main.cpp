/*
  Smart Inventory Palette - Weight Measurement System
  Hardware: ESP32 + HX711 + 20kg Load Cell + Built-in OLED Display
  
  Pin Configuration:
  - HX711 DT  -> ESP32 D4 (GPIO 4)
  - HX711 SCK -> ESP32 D5 (GPIO 5)  
  - HX711 VCC -> ESP32 3V3
  - HX711 GND -> ESP32 GND
  - Built-in Display: SDA=GPIO21, SCL=GPIO22
*/

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HX711.h>
#include "config.h"

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================
HX711 scale;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ============================================================================
// CALIBRATION VALUES (Update these after calibration!)
// ============================================================================
long TARE_OFFSET = 0;           // Zero point offset
float SCALE_FACTOR = 1.0;       // Scale factor (kg per unit)

// ============================================================================
// MEASUREMENT VARIABLES
// ============================================================================
float current_weight = 0.0;
float filtered_weight = 0.0;
int bottle_count = 0;
bool is_stable = false;
bool system_ready = false;

// Timing variables
unsigned long last_reading_time = 0;
unsigned long last_display_time = 0;
unsigned long last_serial_time = 0;

// Moving average filter
float weight_readings[FILTER_SAMPLES];
int reading_index = 0;

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================
void initializeHardware();
void initializeDisplay();
void initializeScale();
void readWeight();
void updateDisplay();
void updateSerial();
void handleSerialCommands();
void calibrateScale();
void tareScale();
void showRawReadings();
void showSystemInfo();
void printHelp();
bool checkHX711Connection();

// ============================================================================
// SETUP FUNCTION
// ============================================================================
void setup() {
    // Initialize serial communication
    Serial.begin(SERIAL_BAUD_RATE);
    delay(2000); // Wait for serial to stabilize
    
    Serial.println("========================================");
    Serial.println("Smart Inventory Palette v1.0");
    Serial.println("Weight Measurement System");
    Serial.println("========================================");
    Serial.println("Hardware: ESP32 + HX711 + 20kg Load Cell");
    Serial.println("PlatformIO + VS Code Development");
    Serial.println("========================================");
    
    // Initialize hardware components
    initializeHardware();
    
    // Initialize filter array
    for (int i = 0; i < FILTER_SAMPLES; i++) {
        weight_readings[i] = 0.0;
    }
    
    // System ready
    system_ready = true;
    Serial.println("System initialization complete!");
    Serial.println("========================================");
    printHelp();
    Serial.println("========================================");
    
    delay(2000); // Show startup info
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
    unsigned long current_time = millis();
    
    // Handle serial commands
    if (Serial.available()) {
        handleSerialCommands();
    }
    
    // Read weight at regular intervals
    if (current_time - last_reading_time >= READING_INTERVAL) {
        readWeight();
        last_reading_time = current_time;
    }
    
    // Update display at regular intervals
    if (current_time - last_display_time >= DISPLAY_INTERVAL) {
        updateDisplay();
        last_display_time = current_time;
    }
    
    // Update serial output at regular intervals
    if (current_time - last_serial_time >= 1000) { // Every 1 second
        updateSerial();
        last_serial_time = current_time;
    }
}

// ============================================================================
// HARDWARE INITIALIZATION
// ============================================================================
void initializeHardware() {
    Serial.println("Initializing hardware components...");
    
    // Initialize I2C for display
    Wire.begin(DISPLAY_SDA_PIN, DISPLAY_SCL_PIN);
    
    // Initialize display
    initializeDisplay();
    
    // Initialize scale
    initializeScale();
    
    Serial.println("Hardware initialization completed successfully!");
}

void initializeDisplay() {
    Serial.print("Initializing OLED display... ");
    
    // Try primary I2C address
    if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.print("failed at 0x3C, trying 0x3D... ");
        
        // Try alternative I2C address
        if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
            Serial.println("FAILED!");
            Serial.println("ERROR: OLED display not found!");
            Serial.println("Check:");
            Serial.println("- Display I2C address (0x3C or 0x3D)");
            Serial.println("- I2C connections (SDA=21, SCL=22)");
            Serial.println("- Display power connections");
            while (true) delay(1000); // Stop execution
        } else {
            Serial.println("SUCCESS at 0x3D!");
        }
    } else {
        Serial.println("SUCCESS at 0x3C!");
    }
    
    // Configure display
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    // Show startup screen
    display.setCursor(0, 0);
    display.println("Smart Palette v1.0");
    display.println("==================");
    display.println("Initializing...");
    display.println("");
    display.println("Hardware: ESP32");
    display.println("Load Cell: 20kg");
    display.println("Status: Starting");
    display.display();
}

void initializeScale() {
    Serial.print("Initializing HX711 load cell amplifier... ");
    
    // Initialize HX711 with your pin configuration
    scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
    
    if (checkHX711Connection()) {
        Serial.println("SUCCESS!");
        
        // Set calibration values
        scale.set_scale(SCALE_FACTOR);
        scale.set_offset(TARE_OFFSET);
        
        // Update display
        display.println("HX711: Connected");
        display.display();
        
        Serial.println("HX711 configuration:");
        Serial.printf("- Data pin (DT): GPIO %d\n", HX711_DOUT_PIN);
        Serial.printf("- Clock pin (SCK): GPIO %d\n", HX711_SCK_PIN);
        Serial.printf("- Scale factor: %.1f\n", SCALE_FACTOR);
        Serial.printf("- Tare offset: %ld\n", TARE_OFFSET);
        
    } else {
        Serial.println("FAILED!");
        Serial.println("ERROR: HX711 not responding!");
        Serial.println("Check connections:");
        Serial.printf("- HX711 VCC -> ESP32 3V3\n");
        Serial.printf("- HX711 GND -> ESP32 GND\n");
        Serial.printf("- HX711 DT  -> ESP32 D2 (GPIO %d)\n", HX711_DOUT_PIN);
        Serial.printf("- HX711 SCK -> ESP32 D4 (GPIO %d)\n", HX711_SCK_PIN);
        Serial.println("- Load cell properly connected to HX711");
        
        display.println("HX711: ERROR!");
        display.println("Check wiring");
        display.display();
        
        while (true) delay(1000); // Stop execution
    }
}

// ============================================================================
// WEIGHT READING AND PROCESSING
// ============================================================================
void readWeight() {
    if (!checkHX711Connection()) {
        Serial.println("WARNING: HX711 connection lost!");
        return;
    }
    
    // Get raw weight reading
    current_weight = scale.get_units(1);
    
    // Handle negative weights (consider as zero)
    if (current_weight < 0) {
        current_weight = 0.0;
    }
    
    // Apply moving average filter
    weight_readings[reading_index] = current_weight;
    reading_index = (reading_index + 1) % FILTER_SAMPLES;
    
    // Calculate filtered weight
    float sum = 0.0;
    for (int i = 0; i < FILTER_SAMPLES; i++) {
        sum += weight_readings[i];
    }
    filtered_weight = sum / FILTER_SAMPLES;
    
    // Check weight stability
    float max_deviation = 0.0;
    for (int i = 0; i < FILTER_SAMPLES; i++) {
        float deviation = abs(weight_readings[i] - filtered_weight);
        if (deviation > max_deviation) {
            max_deviation = deviation;
        }
    }
    is_stable = (max_deviation < STABILITY_THRESHOLD);
    
    // Calculate bottle count
    if (filtered_weight > MIN_WEIGHT_THRESHOLD) {
        bottle_count = (int)(filtered_weight / BOTTLE_WEIGHT);
    } else {
        bottle_count = 0;
        filtered_weight = 0.0; // Force small weights to zero
    }
    
    // Ensure weight doesn't exceed maximum
    if (filtered_weight > MAX_WEIGHT) {
        Serial.println("WARNING: Weight exceeds maximum capacity!");
        filtered_weight = MAX_WEIGHT;
    }
}

// ============================================================================
// DISPLAY UPDATE
// ============================================================================
void updateDisplay() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    // Title bar
    display.setCursor(0, 0);
    display.println("Smart Palette v1.0");
    display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
    
    // Weight display (large font)
    display.setCursor(0, 15);
    display.print("Weight:");
    display.setTextSize(2);
    display.setCursor(0, 25);
    if (filtered_weight < 10.0) {
        display.printf("%.2f kg", filtered_weight);
    } else {
        display.printf("%.1f kg", filtered_weight);
    }
    
    // Bottle count
    display.setTextSize(1);
    display.setCursor(0, 45);
    display.printf("Bottles: ~%d units", bottle_count);
    
    // Status indicator
    display.setCursor(0, 55);
    display.print("Status: ");
    if (!system_ready) {
        display.print("Starting");
    } else if (is_stable) {
        display.print("Ready");
        // Solid circle for stable reading
        display.fillCircle(120, 58, 3, SSD1306_WHITE);
    } else {
        display.print("Measuring");
        // Empty circle for unstable reading
        display.drawCircle(120, 58, 3, SSD1306_WHITE);
    }
    
    display.display();
}

// ============================================================================
// SERIAL OUTPUT UPDATE
// ============================================================================
void updateSerial() {
    Serial.printf("Weight: %.3f kg | Bottles: %d | Stable: %s | Raw: %.3f\n", 
                  filtered_weight, bottle_count, 
                  is_stable ? "YES" : "NO", current_weight);
}

// ============================================================================
// SERIAL COMMAND HANDLING
// ============================================================================
void handleSerialCommands() {
    char command = Serial.read();
    while (Serial.available()) Serial.read(); // Clear input buffer
    
    switch (command) {
        case 't':
        case 'T':
            tareScale();
            break;
            
        case 'c':
        case 'C':
            calibrateScale();
            break;
            
        case 'r':
        case 'R':
            showRawReadings();
            break;
            
        case 'i':
        case 'I':
            showSystemInfo();
            break;
            
        case 'h':
        case 'H':
            printHelp();
            break;
            
        default:
            Serial.printf("Unknown command: '%c'. Type 'h' for help.\n", command);
            break;
    }
}

// ============================================================================
// CALIBRATION FUNCTIONS
// ============================================================================
void tareScale() {
    Serial.println("Taring scale (setting current weight as zero)...");
    
    if (!checkHX711Connection()) {
        Serial.println("ERROR: Cannot tare - HX711 not connected!");
        return;
    }
    
    scale.tare(20); // Average 20 readings
    Serial.println("Scale tared successfully!");
    Serial.printf("New tare offset: %ld\n", scale.get_offset());
}

void calibrateScale() {
    if (!checkHX711Connection()) {
        Serial.println("ERROR: Cannot calibrate - HX711 not connected!");
        return;
    }
    
    Serial.println("========================================");
    Serial.println("SCALE CALIBRATION PROCESS");
    Serial.println("========================================");
    
    // Step 1: Remove all weight
    Serial.println("Step 1: Remove ALL weight from the scale");
    Serial.println("Press Enter when the scale is empty...");
    while (!Serial.available()) delay(100);
    Serial.read(); // Clear input
    
    Serial.println("Taring scale...");
    scale.tare(25); // Use more samples for better accuracy
    long tare_value = scale.get_offset();
    Serial.printf("Tare offset set to: %ld\n", tare_value);
    
    // Step 2: Add known weight
    Serial.println("\nStep 2: Place a KNOWN WEIGHT on the scale");
    Serial.println("For best results, use 1kg or heavier");
    Serial.println("Enter the exact weight in kg (e.g., 1.5 for 1.5kg):");
    
    while (!Serial.available()) delay(100);
    float known_weight = Serial.parseFloat();
    while (Serial.available()) Serial.read(); // Clear input
    
    if (known_weight <= 0 || known_weight > MAX_WEIGHT) {
        Serial.printf("ERROR: Invalid weight! Must be between 0 and %.1f kg\n", MAX_WEIGHT);
        return;
    }
    
    Serial.printf("Using calibration weight: %.3f kg\n", known_weight);
    Serial.println("Make sure the weight is stable, then press Enter...");
    while (!Serial.available()) delay(100);
    Serial.read(); // Clear input
    
    // Step 3: Take calibration reading
    Serial.println("Taking calibration readings...");
    long total_reading = 0;
    const int calibration_samples = 30;
    
    for (int i = 0; i < calibration_samples; i++) {
        total_reading += scale.read();
        delay(100);
        if (i % 5 == 0) Serial.print(".");
    }
    Serial.println();
    
    long average_reading = total_reading / calibration_samples;
    float new_scale_factor = (average_reading - tare_value) / known_weight;
    
    // Display calibration results
    Serial.println("\n========================================");
    Serial.println("CALIBRATION RESULTS:");
    Serial.printf("Tare offset: %ld\n", tare_value);
    Serial.printf("Scale factor: %.2f\n", new_scale_factor);
    Serial.printf("Calibration weight: %.3f kg\n", known_weight);
    Serial.printf("Raw reading: %ld\n", average_reading);
    Serial.println("========================================");
    Serial.println("UPDATE YOUR CODE WITH THESE VALUES:");
    Serial.printf("TARE_OFFSET = %ld;\n", tare_value);
    Serial.printf("SCALE_FACTOR = %.2f;\n", new_scale_factor);
    Serial.println("========================================");
    
    // Apply calibration temporarily
    scale.set_scale(new_scale_factor);
    scale.set_offset(tare_value);
    
    // Test calibration
    Serial.println("Testing calibration...");
    delay(2000);
    float test_weight = scale.get_units(15);
    Serial.printf("Test reading: %.3f kg (expected: %.3f kg)\n", test_weight, known_weight);
    
    float error = abs(test_weight - known_weight);
    Serial.printf("Calibration error: %.0f grams\n", error * 1000);
    
    if (error < 0.05) {
        Serial.println("✓ Calibration EXCELLENT!");
    } else if (error < 0.1) {
        Serial.println("✓ Calibration GOOD");
    } else {
        Serial.println("⚠ Calibration needs improvement");
        Serial.println("Try using a heavier, more precise weight");
    }
    
    Serial.println("\nTo make this calibration permanent:");
    Serial.println("1. Update the TARE_OFFSET and SCALE_FACTOR values in your code");
    Serial.println("2. Build and upload the updated code");
}

// ============================================================================
// DIAGNOSTIC FUNCTIONS
// ============================================================================
void showRawReadings() {
    Serial.println("========================================");
    Serial.println("RAW SENSOR READINGS");
    Serial.println("Press any key to stop...");
    Serial.println("========================================");
    
    while (!Serial.available()) {
        if (checkHX711Connection()) {
            long raw_value = scale.read();
            float weight_value = scale.get_units();
            
            Serial.printf("Raw: %8ld | Weight: %8.3f kg | Offset: %8ld | Scale: %8.2f\n", 
                         raw_value, weight_value, scale.get_offset(), scale.get_scale());
        } else {
            Serial.println("HX711 not responding!");
        }
        delay(500);
    }
    
    while (Serial.available()) Serial.read(); // Clear input
    Serial.println("Raw readings stopped.");
}

void showSystemInfo() {
    Serial.println("========================================");
    Serial.println("SYSTEM INFORMATION");
    Serial.println("========================================");
    Serial.printf("Firmware: Smart Palette v1.0\n");
    Serial.printf("Hardware: ESP32 + HX711 + 20kg Load Cell\n");
    Serial.printf("Development: PlatformIO + VS Code\n");
    Serial.println("----------------------------------------");
    Serial.printf("ESP32 Chip Model: %s\n", ESP.getChipModel());
    Serial.printf("CPU Frequency: %d MHz\n", ESP.getCpuFreqMHz());
    Serial.printf("Flash Size: %d bytes\n", ESP.getFlashChipSize());
    Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
    Serial.printf("Uptime: %lu seconds\n", millis() / 1000);
    Serial.println("----------------------------------------");
    Serial.printf("HX711 Data Pin: GPIO %d\n", HX711_DOUT_PIN);
    Serial.printf("HX711 Clock Pin: GPIO %d\n", HX711_SCK_PIN);
    Serial.printf("Display SDA Pin: GPIO %d\n", DISPLAY_SDA_PIN);
    Serial.printf("Display SCL Pin: GPIO %d\n", DISPLAY_SCL_PIN);
    Serial.println("----------------------------------------");
    Serial.printf("Current Weight: %.3f kg\n", filtered_weight);
    Serial.printf("Bottle Count: %d\n", bottle_count);
    Serial.printf("System Status: %s\n", is_stable ? "Stable" : "Measuring");
    Serial.printf("Scale Factor: %.2f\n", scale.get_scale());
    Serial.printf("Tare Offset: %ld\n", scale.get_offset());
    Serial.println("========================================");
}

void printHelp() {
    Serial.println("AVAILABLE COMMANDS:");
    Serial.println("'t' or 'T' - Tare scale (set current weight as zero)");
    Serial.println("'c' or 'C' - Start calibration process");
    Serial.println("'r' or 'R' - Show raw sensor readings");
    Serial.println("'i' or 'I' - Show system information");
    Serial.println("'h' or 'H' - Show this help menu");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
bool checkHX711Connection() {
    return scale.is_ready();
}