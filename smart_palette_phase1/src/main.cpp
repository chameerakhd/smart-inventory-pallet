/*
  Smart Inventory Palette - Phase 1
  PlatformIO Version
  
  Hardware:
  - ESP32 WROOM with built-in display
  - 20kg Load Cell
  - HX711 Load Cell Amplifier
  
  Development Environment: VS Code + PlatformIO
  Author: Dinith Chameera
  Date: August 2025 
  Version: 1.0
*/

#include <Arduino.h>  // Required for PlatformIO
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HX711.h>

// Include configuration (create this file in include/ folder)
#include "config.h"

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================
HX711 scale;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

// Calibration values - CALIBRATE THESE FOR YOUR SETUP!
long TARE_OFFSET = 0;           // Zero point offset
float SCALE_FACTOR = 2280.0;    // Scale factor (adjust after calibration)

// Measurement variables
float current_weight = 0.0;
float filtered_weight = 0.0;
int bottle_count = 0;
bool is_stable = false;
bool hx711_ready = false;

// Timing variables
unsigned long last_reading_time = 0;
unsigned long last_display_update = 0;
unsigned long last_heartbeat = 0;

// Filtering variables
float weight_readings[FILTER_SAMPLES];
int reading_index = 0;

// System status
typedef enum {
    SYSTEM_INIT,
    SYSTEM_READY,
    SYSTEM_MEASURING,
    SYSTEM_ERROR
} system_state_t;

system_state_t system_state = SYSTEM_INIT;

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================
void initializeHardware();
void initializeDisplay();
void initializeScale();
void readWeight();
void updateDisplay();
void handleSerialCommands();
void calibrateScale();
void showRawReadings();
void printSystemInfo();
void handleSystemError();
float getStableWeight(int samples = 10);
bool checkHX711();

// ============================================================================
// SETUP FUNCTION
// ============================================================================
void setup() {
    // Initialize serial communication
    Serial.begin(SERIAL_BAUD_RATE);
    delay(1000); // Wait for serial to initialize
    
    Serial.println("====================================");
    Serial.println("Smart Inventory Palette - Phase 1");
    Serial.println("PlatformIO Development Version");
    Serial.println("====================================");
    
    // Initialize hardware components
    initializeHardware();
    
    // Print system information
    printSystemInfo();
    
    // Initialize arrays
    for (int i = 0; i < FILTER_SAMPLES; i++) {
        weight_readings[i] = 0.0;
    }
    
    system_state = SYSTEM_READY;
    Serial.println("System ready!");
    Serial.println("====================================");
    Serial.println("Commands:");
    Serial.println("'t' - Tare (reset to zero)");
    Serial.println("'c' - Start calibration");
    Serial.println("'r' - Show raw readings");
    Serial.println("'i' - System information");
    Serial.println("'h' - Help");
    Serial.println("====================================");
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
    unsigned long current_time = millis();
    
    // Handle serial commands
    handleSerialCommands();
    
    // System heartbeat
    if (current_time - last_heartbeat >= HEARTBEAT_INTERVAL) {
        hx711_ready = checkHX711();
        last_heartbeat = current_time;
        
        if (!hx711_ready && system_state != SYSTEM_ERROR) {
            Serial.println("ERROR: HX711 not responding!");
            system_state = SYSTEM_ERROR;
        }
    }
    
    // Handle system states
    switch (system_state) {
        case SYSTEM_READY:
        case SYSTEM_MEASURING:
            // Read weight at regular intervals
            if (current_time - last_reading_time >= READING_INTERVAL) {
                readWeight();
                last_reading_time = current_time;
            }
            
            // Update display at regular intervals
            if (current_time - last_display_update >= DISPLAY_INTERVAL) {
                updateDisplay();
                last_display_update = current_time;
            }
            break;
            
        case SYSTEM_ERROR:
            handleSystemError();
            break;
            
        default:
            break;
    }
}

// ============================================================================
// HARDWARE INITIALIZATION
// ============================================================================
void initializeHardware() {
    Serial.println("Initializing hardware...");
    
    // Initialize I2C for display
    Wire.begin();
    
    // Initialize display
    initializeDisplay();
    
    // Initialize scale
    initializeScale();
    
    Serial.println("Hardware initialization complete.");
}

void initializeDisplay() {
    Serial.print("Initializing display... ");
    
    if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println("FAILED!");
        Serial.println("SSD1306 allocation failed!");
        while (true) {
            delay(1000); // Stop execution
        }
    }
    
    Serial.println("OK");
    
    // Show startup screen
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Smart Palette v1.0");
    display.println("PlatformIO Edition");
    display.println("");
    display.println("Initializing...");
    display.println("Hardware: ESP32");
    display.println("Load Cell: 20kg");
    display.display();
}

void initializeScale() {
    Serial.print("Initializing HX711... ");
    
    // Initialize HX711
    scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
    
    if (scale.is_ready()) {
        Serial.println("OK");
        
        // Set calibration values
        scale.set_scale(SCALE_FACTOR);
        scale.set_offset(TARE_OFFSET);
        
        // Update display
        display.println("HX711: OK");
        display.display();
        
        hx711_ready = true;
    } else {
        Serial.println("FAILED!");
        Serial.println("HX711 not responding!");
        
        display.println("HX711: ERROR");
        display.display();
        
        system_state = SYSTEM_ERROR;
        hx711_ready = false;
    }
}

// ============================================================================
// WEIGHT READING FUNCTION
// ============================================================================
void readWeight() {
    if (!hx711_ready || !scale.is_ready()) {
        return;
    }
    
    system_state = SYSTEM_MEASURING;
    
    // Get weight reading
    current_weight = scale.get_units(1);
    
    // Handle negative weights (treat as zero)
    if (current_weight < 0) {
        current_weight = 0;
    }
    
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
        if (diff > max_diff) {
            max_diff = diff;
        }
    }
    is_stable = (max_diff < STABILITY_THRESHOLD);
    
    // Calculate bottle count
    if (filtered_weight > MIN_WEIGHT_THRESHOLD) {
        bottle_count = (int)(filtered_weight / BOTTLE_WEIGHT);
    } else {
        bottle_count = 0;
        filtered_weight = 0; // Force to zero for very small weights
    }
    
    // Print to serial for monitoring
    Serial.printf("Weight: %.2f kg | Bottles: %d | Stable: %s | Raw: %.2f\n", 
                  filtered_weight, bottle_count, 
                  is_stable ? "YES" : "NO", current_weight);
    
    system_state = SYSTEM_READY;
}

// ============================================================================
// DISPLAY UPDATE FUNCTION
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
    display.printf("%.2f kg", filtered_weight);
    
    // Bottle count
    display.setTextSize(1);
    display.setCursor(0, 45);
    display.printf("Bottles: ~%d units", bottle_count);
    
    // Status line
    display.setCursor(0, 55);
    
    switch (system_state) {
        case SYSTEM_READY:
            if (is_stable) {
                display.print("Status: Ready");
                // Solid circle for stable
                display.fillCircle(120, 58, 3, SSD1306_WHITE);
            } else {
                display.print("Status: Measuring");
                // Empty circle for measuring
                display.drawCircle(120, 58, 3, SSD1306_WHITE);
            }
            break;
            
        case SYSTEM_MEASURING:
            display.print("Status: Reading...");
            display.drawCircle(120, 58, 3, SSD1306_WHITE);
            break;
            
        case SYSTEM_ERROR:
            display.print("Status: ERROR");
            // X mark for error
            display.drawLine(117, 55, 123, 61, SSD1306_WHITE);
            display.drawLine(123, 55, 117, 61, SSD1306_WHITE);
            break;
            
        default:
            display.print("Status: Unknown");
            break;
    }
    
    display.display();
}

// ============================================================================
// SERIAL COMMAND HANDLER
// ============================================================================
void handleSerialCommands() {
    if (Serial.available()) {
        char command = Serial.read();
        Serial.read(); // Clear any remaining characters
        
        switch (command) {
            case 't':
            case 'T':
                Serial.println("Taring scale...");
                if (hx711_ready) {
                    scale.tare(10); // Average 10 readings
                    Serial.println("Scale tared successfully!");
                } else {
                    Serial.println("ERROR: HX711 not ready!");
                }
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
                printSystemInfo();
                break;
                
            case 'h':
            case 'H':
                Serial.println("====================================");
                Serial.println("AVAILABLE COMMANDS:");
                Serial.println("'t' - Tare (reset to zero)");
                Serial.println("'c' - Start calibration process");
                Serial.println("'r' - Show raw readings");
                Serial.println("'i' - Show system information");
                Serial.println("'h' - Show this help");
                Serial.println("====================================");
                break;
                
            default:
                Serial.printf("Unknown command: '%c'. Type 'h' for help.\n", command);
                break;
        }
    }
}

// ============================================================================
// CALIBRATION FUNCTION
// ============================================================================
void calibrateScale() {
    if (!hx711_ready) {
        Serial.println("ERROR: HX711 not ready for calibration!");
        return;
    }
    
    Serial.println("====================================");
    Serial.println("SCALE CALIBRATION PROCESS");
    Serial.println("====================================");
    
    // Step 1: Tare
    Serial.println("Step 1: Remove all weight from scale");
    Serial.println("Press Enter when ready...");
    while (!Serial.available()) {
        delay(100);
    }
    Serial.read(); // Clear buffer
    
    Serial.println("Taring scale...");
    scale.tare(20); // Average 20 readings for better accuracy
    long tare_value = scale.get_offset();
    Serial.printf("Tare value: %ld\n", tare_value);
    
    // Step 2: Calibration weight
    Serial.println("\nStep 2: Place a known weight on the scale");
    Serial.println("Enter the weight in kg (e.g., 1.5 for 1.5kg):");
    
    while (!Serial.available()) {
        delay(100);
    }
    float known_weight = Serial.parseFloat();
    while (Serial.available()) Serial.read(); // Clear buffer
    
    if (known_weight <= 0) {
        Serial.println("ERROR: Invalid weight entered!");
        return;
    }
    
    Serial.printf("Using calibration weight: %.3f kg\n", known_weight);
    Serial.println("Ensure weight is stable, then press Enter...");
    
    while (!Serial.available()) {
        delay(100);
    }
    Serial.read(); // Clear buffer
    
    // Take calibration reading
    Serial.println("Taking calibration reading...");
    delay(2000); // Let it stabilize
    
    long calibration_reading = 0;
    const int cal_samples = 20;
    for (int i = 0; i < cal_samples; i++) {
        calibration_reading += scale.read();
        delay(100);
        Serial.print(".");
    }
    calibration_reading /= cal_samples;
    Serial.println();
    
    // Calculate new scale factor
    float new_scale_factor = (calibration_reading - tare_value) / known_weight;
    
    // Display results
    Serial.println("\n====================================");
    Serial.println("CALIBRATION RESULTS:");
    Serial.printf("Tare Offset: %ld\n", tare_value);
    Serial.printf("Scale Factor: %.1f\n", new_scale_factor);
    Serial.printf("Test Weight: %.3f kg\n", known_weight);
    Serial.printf("Raw Reading: %ld\n", calibration_reading);
    Serial.println("====================================");
    Serial.println("Update these values in your code:");
    Serial.printf("TARE_OFFSET = %ld;\n", tare_value);
    Serial.printf("SCALE_FACTOR = %.1f;\n", new_scale_factor);
    Serial.println("====================================");
    
    // Apply calibration temporarily
    scale.set_scale(new_scale_factor);
    scale.set_offset(tare_value);
    
    // Test the calibration
    Serial.println("Testing calibration...");
    delay(1000);
    float test_weight = scale.get_units(10);
    Serial.printf("Test reading: %.3f kg (should be close to %.3f kg)\n", 
                  test_weight, known_weight);
    
    Serial.println("Calibration complete! Update your code with the values above.");
}

// ============================================================================
// RAW READINGS FUNCTION
// ============================================================================
void showRawReadings() {
    if (!hx711_ready) {
        Serial.println("ERROR: HX711 not ready!");
        return;
    }
    
    Serial.println("====================================");
    Serial.println("RAW READINGS MODE");
    Serial.println("Press any key to stop...");
    Serial.println("====================================");
    
    while (!Serial.available()) {
        if (scale.is_ready()) {
            long raw = scale.read();
            float weight = scale.get_units();
            Serial.printf("Raw: %8ld | Weight: %8.3f kg | Offset: %8ld | Scale: %8.1f\n", 
                         raw, weight, scale.get_offset(), scale.get_scale());
        }
        delay(500);
    }
    
    while (Serial.available()) Serial.read(); // Clear buffer
    Serial.println("Raw reading mode stopped.");
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
void printSystemInfo() {
    Serial.println("====================================");
    Serial.println("SYSTEM INFORMATION");
    Serial.println("====================================");
    Serial.printf("Platform: ESP32\n");
    Serial.printf("Chip Model: %s\n", ESP.getChipModel());
    Serial.printf("Chip Revision: %d\n", ESP.getChipRevision());
    Serial.printf("CPU Frequency: %d MHz\n", ESP.getCpuFreqMHz());
    Serial.printf("Flash Size: %d bytes\n", ESP.getFlashChipSize());
    Serial.printf("Free Heap: %d bytes\n", ESP.getFreeHeap());
    Serial.printf("Uptime: %lu ms\n", millis());
    Serial.println("------------------------------------");
    Serial.printf("HX711 Status: %s\n", hx711_ready ? "Ready" : "Not Ready");
    Serial.printf("Current Weight: %.3f kg\n", filtered_weight);
    Serial.printf("Bottle Count: %d\n", bottle_count);
    Serial.printf("System State: %d\n", system_state);
    Serial.printf("Scale Factor: %.1f\n", scale.get_scale());
    Serial.printf("Tare Offset: %ld\n", scale.get_offset());
    Serial.println("====================================");
}

bool checkHX711() {
    return scale.is_ready();
}

float getStableWeight(int samples) {
    if (!hx711_ready) return 0.0;
    
    float total = 0;
    for (int i = 0; i < samples; i++) {
        if (scale.is_ready()) {
            total += scale.get_units();
        }
        delay(100);
    }
    return total / samples;
}

void handleSystemError() {
    static unsigned long last_error_check = 0;
    
    if (millis() - last_error_check > 5000) { // Check every 5 seconds
        Serial.println("Attempting to recover from error...");
        
        // Try to reinitialize HX711
        if (scale.is_ready()) {
            Serial.println("HX711 recovered!");
            system_state = SYSTEM_READY;
            hx711_ready = true;
        } else {
            Serial.println("HX711 still not responding.");
        }
        
        last_error_check = millis();
    }
    
    // Update display with error status
    if (millis() - last_display_update >= DISPLAY_INTERVAL) {
        updateDisplay();
        last_display_update = millis();
    }
}