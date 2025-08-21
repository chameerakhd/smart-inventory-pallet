/*
  Smart Inventory Palette - Complete Workflow System
  
  Hardware: ESP32 + 2x HX711 + 2x 20kg Load Cells + PN532 NFC + LEDs
  
  Workflow:
  1. Single NFC Tap → Start Load (Blue LED) → Identify Truck
  2. Second NFC Tap → Finish Load (Green LED) → Submit to SaaS
  3. Double NFC Tap → Switch to Unload Mode (Red LED)
  4. NFC Tap after Unload → Finish Unload (Green LED) → Submit Unload
  
  File: main.cpp
*/

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HX711.h>
#include <Adafruit_PN532.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "freertos/semphr.h"

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// API Configuration
const char* API_BASE_URL = "https://your-saas-domain.com/api";
const char* API_KEY = "your-api-key";

// Hardware Configuration
const String PALETTE_ID = "PAL_001";
const float BOTTLE_WEIGHT = 0.1;  // 100ml bottle = 0.1kg
const float STABILITY_THRESHOLD = 0.05;  // 50g stability
const int FILTER_SAMPLES = 10;

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
#define DOUBLE_TAP_TIME   2000  // 2 seconds for double tap
#define WEIGHT_READ_DELAY 100   // 100ms between weight readings
#define API_SEND_INTERVAL 5000  // 5 seconds between API updates
#define DISPLAY_UPDATE    1000  // 1 second display update

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================
HX711 scale1, scale2;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Adafruit_PN532 nfc(PN532_SDA, PN532_SCL);

// ============================================================================
// SYSTEM STATE VARIABLES
// ============================================================================
enum SystemState {
  STATE_IDLE,
  STATE_LOAD_MODE,
  STATE_LOAD_COMPLETE,
  STATE_UNLOAD_MODE,
  STATE_UNLOAD_COMPLETE
};

struct SystemData {
  SystemState currentState;
  float totalWeight;
  float filteredWeight;
  int bottleCount;
  String currentTruckId;
  String lastNfcCardId;
  unsigned long lastNfcTapTime;
  unsigned long transactionStartTime;
  bool isWeightStable;
  bool wifiConnected;
  int transactionCount;
  float initialWeight;
  float weightChange;
};

SystemData systemData = {
  .currentState = STATE_IDLE,
  .totalWeight = 0.0,
  .filteredWeight = 0.0,
  .bottleCount = 0,
  .currentTruckId = "",
  .lastNfcCardId = "",
  .lastNfcTapTime = 0,
  .transactionStartTime = 0,
  .isWeightStable = false,
  .wifiConnected = false,
  .transactionCount = 0,
  .initialWeight = 0.0,
  .weightChange = 0.0
};

// Thread-safe data sharing
SemaphoreHandle_t dataMutex;
QueueHandle_t apiQueue;

// Weight filtering
float weightReadings[FILTER_SAMPLES];
int readingIndex = 0;
bool filterInitialized = false;

// NFC Card to Truck mapping
struct TruckMapping {
  String cardId;
  String truckId;
  String driverName;
};

TruckMapping truckCards[] = {
  {"04:52:F3:2A", "TRUCK_A", "Driver John"},
  {"04:A1:B2:3C", "TRUCK_B", "Driver Mike"},
  {"04:C4:D5:E6", "TRUCK_C", "Driver Sarah"}
};
const int NUM_TRUCKS = 3;

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================
void setup();
void loop();

// Hardware initialization
void initializeHardware();
void initializeWiFi();
void initializeDisplay();
void initializeNFC();
void initializeLEDs();

// FreeRTOS Tasks
void weightMonitoringTask(void* parameter);
void nfcWorkflowTask(void* parameter);
void apiCommunicationTask(void* parameter);
void displayUpdateTask(void* parameter);

// Core functions
void readWeightData();
void processNfcEvent(String cardId);
void updateSystemState();
void controlLEDs();
void sendApiUpdate();
void updateDisplay();

// Utility functions
String getTruckIdFromCard(String cardId);
bool isDoubleTap(unsigned long currentTime);
void changeSystemState(SystemState newState);
float calculateBottleCount(float weight);
bool isWeightStable();

// API functions
bool sendLoadingTransaction(bool isComplete = false);
bool sendUnloadingTransaction(bool isComplete = false);
bool makeApiRequest(String endpoint, JsonDocument& payload);

// ============================================================================
// MAIN SETUP FUNCTION
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("========================================");
  Serial.println("Smart Inventory Palette v2.0");
  Serial.println("Dual Load Cell + NFC Workflow System");
  Serial.println("========================================");
  
  // Initialize hardware
  initializeHardware();
  
  // Create mutex for thread-safe data access
  dataMutex = xSemaphoreCreateMutex();
  
  // Create queue for API communication
  apiQueue = xQueueCreate(10, sizeof(String));
  
  // Create FreeRTOS tasks
  xTaskCreatePinnedToCore(
    weightMonitoringTask,   // Function
    "WeightMonitor",        // Name
    4096,                   // Stack size
    NULL,                   // Parameter
    2,                      // Priority
    NULL,                   // Task handle
    0                       // Core 0
  );
  
  xTaskCreatePinnedToCore(
    nfcWorkflowTask,
    "NFCWorkflow",
    4096,
    NULL,
    3,                      // Higher priority for NFC
    NULL,
    1                       // Core 1
  );
  
  xTaskCreatePinnedToCore(
    apiCommunicationTask,
    "APIComm",
    8192,                   // Larger stack for HTTP
    NULL,
    1,
    NULL,
    1                       // Core 1
  );
  
  xTaskCreatePinnedToCore(
    displayUpdateTask,
    "DisplayUpdate",
    2048,
    NULL,
    1,
    NULL,
    0                       // Core 0
  );
  
  Serial.println("System initialized successfully!");
  Serial.println("All tasks started. System ready for operation.");
  Serial.println("========================================");
}

// ============================================================================
// MAIN LOOP (Minimal - Most work done in tasks)
// ============================================================================
void loop() {
  // Main loop kept minimal since FreeRTOS tasks handle everything
  vTaskDelay(1000 / portTICK_PERIOD_MS);
  
  // Monitor system health
  if (millis() % 30000 == 0) {  // Every 30 seconds
    Serial.printf("System Health: State=%d, Weight=%.2f kg, Bottles=%d, WiFi=%s\n", 
                  systemData.currentState, 
                  systemData.filteredWeight, 
                  systemData.bottleCount,
                  systemData.wifiConnected ? "OK" : "DISCONNECTED");
  }
}

// ============================================================================
// HARDWARE INITIALIZATION
// ============================================================================
void initializeHardware() {
  Serial.println("Initializing hardware components...");
  
  // Initialize I2C
  Wire.begin(PN532_SDA, PN532_SCL);
  
  // Initialize components
  initializeLEDs();
  initializeDisplay();
  initializeNFC();
  
  // Initialize load cells
  Serial.print("Initializing load cells... ");
  scale1.begin(HX711_1_DT, HX711_1_SCK);
  scale2.begin(HX711_2_DT, HX711_2_SCK);
  
  if (scale1.is_ready() && scale2.is_ready()) {
    Serial.println("SUCCESS");
    // Set calibration factors (update these after calibration)
    scale1.set_scale(-7050.0);  // Calibration factor for scale 1
    scale2.set_scale(-7050.0);  // Calibration factor for scale 2
    scale1.tare();
    scale2.tare();
  } else {
    Serial.println("FAILED - Check connections");
  }
  
  // Initialize WiFi
  initializeWiFi();
  
  Serial.println("Hardware initialization complete!");
}

void initializeWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    systemData.wifiConnected = true;
    Serial.println(" CONNECTED");
    Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    systemData.wifiConnected = false;
    Serial.println(" FAILED");
  }
}

void initializeDisplay() {
  Serial.print("Initializing OLED display... ");
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("FAILED");
    return;
  }
  
  Serial.println("SUCCESS");
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Smart Palette v2.0");
  display.println("Initializing...");
  display.display();
}

void initializeNFC() {
  Serial.print("Initializing PN532 NFC... ");
  
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  
  if (!versiondata) {
    Serial.println("FAILED - PN532 not found");
    return;
  }
  
  Serial.println("SUCCESS");
  Serial.printf("Found chip PN5%02X\n", (versiondata >> 24) & 0xFF);
  
  // Configure for reading RFID tags
  nfc.SAMConfig();
}

void initializeLEDs() {
  Serial.print("Initializing LEDs... ");
  
  pinMode(BLUE_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUILTIN_LED, OUTPUT);
  
  // Turn off all LEDs
  digitalWrite(BLUE_LED, LOW);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUILTIN_LED, LOW);
  
  Serial.println("SUCCESS");
  
  // LED test sequence
  digitalWrite(BLUE_LED, HIGH);
  delay(200);
  digitalWrite(BLUE_LED, LOW);
  digitalWrite(GREEN_LED, HIGH);
  delay(200);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, HIGH);
  delay(200);
  digitalWrite(RED_LED, LOW);
}

// ============================================================================
// FREERTOS TASKS
// ============================================================================

void weightMonitoringTask(void* parameter) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  
  while (true) {
    readWeightData();
    
    // Update system state based on weight changes
    if (xSemaphoreTake(dataMutex, portMAX_DELAY)) {
      updateSystemState();
      xSemaphoreGive(dataMutex);
    }
    
    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(WEIGHT_READ_DELAY));
  }
}

void nfcWorkflowTask(void* parameter) {
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;
  
  while (true) {
    // Check for NFC card
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength)) {
      // Convert UID to string
      String cardId = "";
      for (uint8_t i = 0; i < uidLength; i++) {
        if (i > 0) cardId += ":";
        if (uid[i] < 0x10) cardId += "0";
        cardId += String(uid[i], HEX);
      }
      cardId.toUpperCase();
      
      Serial.printf("NFC Card detected: %s\n", cardId.c_str());
      
      processNfcEvent(cardId);
      
      // Prevent multiple reads of same card
      delay(1000);
    }
    
    vTaskDelay(pdMS_TO_TICKS(100));  // Check every 100ms
  }
}

void apiCommunicationTask(void* parameter) {
  String apiMessage;
  
  while (true) {
    // Send periodic updates during active transactions
    if (xSemaphoreTake(dataMutex, portMAX_DELAY)) {
      if (systemData.currentState == STATE_LOAD_MODE || 
          systemData.currentState == STATE_UNLOAD_MODE) {
        
        unsigned long currentTime = millis();
        if (currentTime - systemData.transactionStartTime > API_SEND_INTERVAL) {
          sendApiUpdate();
          systemData.transactionStartTime = currentTime;
        }
      }
      xSemaphoreGive(dataMutex);
    }
    
    // Process any queued API messages
    if (xQueueReceive(apiQueue, &apiMessage, 0)) {
      Serial.printf("Processing API message: %s\n", apiMessage.c_str());
      // Process the API message here
    }
    
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

void displayUpdateTask(void* parameter) {
  while (true) {
    updateDisplay();
    controlLEDs();
    
    vTaskDelay(pdMS_TO_TICKS(DISPLAY_UPDATE));
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

void readWeightData() {
  if (!scale1.is_ready() || !scale2.is_ready()) {
    return;
  }
  
  float weight1 = scale1.get_units(1);
  float weight2 = scale2.get_units(1);
  
  // Combine weights from both load cells
  float totalWeight = weight1 + weight2;
  
  // Handle negative weights (sensor noise)
  if (totalWeight < 0) totalWeight = 0;
  
  // Apply moving average filter
  weightReadings[readingIndex] = totalWeight;
  readingIndex = (readingIndex + 1) % FILTER_SAMPLES;
  
  if (readingIndex == 0) filterInitialized = true;
  
  if (filterInitialized) {
    float sum = 0;
    for (int i = 0; i < FILTER_SAMPLES; i++) {
      sum += weightReadings[i];
    }
    
    systemData.totalWeight = totalWeight;
    systemData.filteredWeight = sum / FILTER_SAMPLES;
    systemData.bottleCount = calculateBottleCount(systemData.filteredWeight);
    systemData.isWeightStable = isWeightStable();
  }
}

void processNfcEvent(String cardId) {
  unsigned long currentTime = millis();
  String truckId = getTruckIdFromCard(cardId);
  
  if (truckId.isEmpty()) {
    Serial.println("Unknown NFC card - ignoring");
    return;
  }
  
  bool isDoubleTapEvent = isDoubleTap(currentTime);
  
  if (xSemaphoreTake(dataMutex, portMAX_DELAY)) {
    switch (systemData.currentState) {
      case STATE_IDLE:
        if (isDoubleTapEvent) {
          // Double tap in idle = start unload mode
          changeSystemState(STATE_UNLOAD_MODE);
          systemData.currentTruckId = truckId;
          systemData.initialWeight = systemData.filteredWeight;
          Serial.printf("Started UNLOAD mode for %s\n", truckId.c_str());
        } else {
          // Single tap in idle = start load mode
          changeSystemState(STATE_LOAD_MODE);
          systemData.currentTruckId = truckId;
          systemData.initialWeight = systemData.filteredWeight;
          Serial.printf("Started LOAD mode for %s\n", truckId.c_str());
        }
        systemData.transactionStartTime = currentTime;
        break;
        
      case STATE_LOAD_MODE:
        if (truckId == systemData.currentTruckId) {
          // Second tap = complete loading
          changeSystemState(STATE_LOAD_COMPLETE);
          systemData.weightChange = systemData.filteredWeight - systemData.initialWeight;
          sendLoadingTransaction(true);
          Serial.printf("Completed LOAD transaction for %s\n", truckId.c_str());
          
          // Auto return to idle after 3 seconds
          vTaskDelay(pdMS_TO_TICKS(3000));
          changeSystemState(STATE_IDLE);
        }
        break;
        
      case STATE_UNLOAD_MODE:
        if (truckId == systemData.currentTruckId) {
          // Tap after unload = complete unloading
          changeSystemState(STATE_UNLOAD_COMPLETE);
          systemData.weightChange = systemData.initialWeight - systemData.filteredWeight;
          sendUnloadingTransaction(true);
          Serial.printf("Completed UNLOAD transaction for %s\n", truckId.c_str());
          
          // Auto return to idle after 3 seconds
          vTaskDelay(pdMS_TO_TICKS(3000));
          changeSystemState(STATE_IDLE);
        }
        break;
        
      default:
        break;
    }
    
    systemData.lastNfcCardId = cardId;
    systemData.lastNfcTapTime = currentTime;
    xSemaphoreGive(dataMutex);
  }
}

void updateSystemState() {
  // This function can be used for additional state logic
  // Currently weight monitoring is handled in readWeightData()
}

void controlLEDs() {
  // Update built-in LED for WiFi status
  digitalWrite(BUILTIN_LED, systemData.wifiConnected ? HIGH : LOW);
  
  // Control status LEDs based on system state
  switch (systemData.currentState) {
    case STATE_IDLE:
      digitalWrite(BLUE_LED, LOW);
      digitalWrite(GREEN_LED, LOW);
      digitalWrite(RED_LED, LOW);
      break;
      
    case STATE_LOAD_MODE:
      digitalWrite(BLUE_LED, HIGH);
      digitalWrite(GREEN_LED, LOW);
      digitalWrite(RED_LED, LOW);
      break;
      
    case STATE_LOAD_COMPLETE:
      digitalWrite(BLUE_LED, LOW);
      digitalWrite(GREEN_LED, HIGH);
      digitalWrite(RED_LED, LOW);
      break;
      
    case STATE_UNLOAD_MODE:
      digitalWrite(BLUE_LED, LOW);
      digitalWrite(GREEN_LED, LOW);
      digitalWrite(RED_LED, HIGH);
      break;
      
    case STATE_UNLOAD_COMPLETE:
      digitalWrite(BLUE_LED, LOW);
      digitalWrite(GREEN_LED, HIGH);
      digitalWrite(RED_LED, LOW);
      break;
  }
}

void sendApiUpdate() {
  if (systemData.currentState == STATE_LOAD_MODE) {
    sendLoadingTransaction(false);
  } else if (systemData.currentState == STATE_UNLOAD_MODE) {
    sendUnloadingTransaction(false);
  }
}

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(0, 0);
  display.println("Smart Palette v2.0");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Weight display
  display.setCursor(0, 15);
  display.printf("Weight: %.2f kg", systemData.filteredWeight);
  
  display.setCursor(0, 25);
  display.printf("Bottles: %d", systemData.bottleCount);
  
  // State display
  display.setCursor(0, 35);
  display.print("State: ");
  switch (systemData.currentState) {
    case STATE_IDLE:
      display.print("IDLE");
      break;
    case STATE_LOAD_MODE:
      display.print("LOADING");
      break;
    case STATE_LOAD_COMPLETE:
      display.print("LOAD DONE");
      break;
    case STATE_UNLOAD_MODE:
      display.print("UNLOADING");
      break;
    case STATE_UNLOAD_COMPLETE:
      display.print("UNLOAD DONE");
      break;
  }
  
  // Truck info
  if (!systemData.currentTruckId.isEmpty()) {
    display.setCursor(0, 45);
    display.printf("Truck: %s", systemData.currentTruckId.c_str());
  }
  
  // Status indicators
  display.setCursor(0, 55);
  display.printf("WiFi:%s Stable:%s", 
                systemData.wifiConnected ? "OK" : "NO",
                systemData.isWeightStable ? "YES" : "NO");
  
  display.display();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

String getTruckIdFromCard(String cardId) {
  for (int i = 0; i < NUM_TRUCKS; i++) {
    if (truckCards[i].cardId == cardId) {
      return truckCards[i].truckId;
    }
  }
  return "";
}

bool isDoubleTap(unsigned long currentTime) {
  return (currentTime - systemData.lastNfcTapTime) < DOUBLE_TAP_TIME;
}

void changeSystemState(SystemState newState) {
  systemData.currentState = newState;
  systemData.transactionCount++;
  Serial.printf("State changed to: %d\n", newState);
}

float calculateBottleCount(float weight) {
  if (weight < 0.05) return 0;  // Ignore weights below 50g
  return weight / BOTTLE_WEIGHT;
}

bool isWeightStable() {
  if (!filterInitialized) return false;
  
  float maxDev = 0;
  for (int i = 0; i < FILTER_SAMPLES; i++) {
    float dev = abs(weightReadings[i] - systemData.filteredWeight);
    if (dev > maxDev) maxDev = dev;
  }
  
  return maxDev < STABILITY_THRESHOLD;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

// bool sendLoadingTransaction(bool isComplete) {
//   if (!systemData.wifiConnected) return false;
  
//   DynamicJsonDocument doc(1024);
//   doc["palette_id"] = PALETTE_ID;
//   doc["truck_id"] = systemData.currentTruckId;
//   doc["bottle_count"] = systemData.bottleCount;
//   doc["weight"] = systemData.filteredWeight;
//   doc["weight_change"] = systemData.weightChange;
//   doc["timestamp"] = millis();
//   doc["is_complete"] = isComplete;
//   doc["transaction_type"] = "LOAD";
  
//   return makeApiRequest("/addNewLoading", doc);
// }

// bool sendUnloadingTransaction(bool isComplete) {
//   if (!systemData.wifiConnected) return false;
  
//   DynamicJsonDocument doc(1024);
//   doc["palette_id"] = PALETTE_ID;
//   doc["truck_id"] = systemData.currentTruckId;
//   doc["bottle_count"] = systemData.bottleCount;
//   doc["weight"] = systemData.filteredWeight;
//   doc["weight_change"] = systemData.weightChange;
//   doc["timestamp"] = millis();
//   doc["is_complete"] = isComplete;
//   doc["transaction_type"] = "UNLOAD";
  
//   return makeApiRequest("/addNewUnloading", doc);
// }

// bool makeApiRequest(String endpoint, JsonDocument& payload) {
//   HTTPClient http;
//   http.begin(String(API_BASE_URL) + endpoint);
//   http.addHeader("Content-Type", "application/json");
//   http.addHeader("Authorization", "Bearer " + String(API_KEY));
  
//   String jsonString;
//   serializeJson(payload, jsonString);
  
//   int httpResponseCode = http.POST(jsonString);
  
//   if (httpResponseCode > 0) {
//     String response = http.getString();
//     Serial.printf("API Response (%d): %s\n", httpResponseCode, response.c_str());
//     http.end();
//     return httpResponseCode == 200 || httpResponseCode == 201;
//   }
  
//   Serial.printf("API Request failed: %d\n", httpResponseCode);
//   http.end();
//   return false;
// }