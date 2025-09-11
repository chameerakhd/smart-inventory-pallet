// #include <SoftwareSerial.h>
// #include <WiFi.h>
// #include <HTTPClient.h>
// #include <ArduinoJson.h>

// // Hardware pins
// #define NFC_RX_PIN 16
// #define NFC_TX_PIN 17
// #define BLUE_LED 18
// #define GREEN_LED 19
// #define RED_LED 21

// // NFC Communication
// SoftwareSerial nfcSerial(NFC_RX_PIN, NFC_TX_PIN);

// // System states
// enum PalletState {
//   IDLE,
//   READY_TO_LOAD,
//   LOADING,
//   READY_TO_UNLOAD,
//   UNLOADING
// };

// // Global variables
// PalletState currentState = IDLE;
// String currentLorryId = "";
// unsigned long lastTapTime = 0;
// int tapCount = 0;
// bool doubleTapDetected = false;

// // Known NFC card IDs (you'll need to scan these first)
// String knownCards[3] = {
//   "CARD_ID_1", // Replace with actual card IDs
//   "CARD_ID_2",
//   "CARD_ID_3"
// };

// String lorryNames[3] = {
//   "Lorry_A",
//   "Lorry_B", 
//   "Lorry_C"
// };

// void setup() {
//   Serial.begin(115200);
//   nfcSerial.begin(9600);
  
//   // Initialize LED pins
//   pinMode(BLUE_LED, OUTPUT);
//   pinMode(GREEN_LED, OUTPUT);
//   pinMode(RED_LED, OUTPUT);
  
//   // Turn off all LEDs initially
//   setAllLEDs(false);
  
//   Serial.println("NFC Pallet System Initialized");
//   Serial.println("Tap NFC card to start...");
  
//   // Initialize NFC reader
//   initializeNFC();
// }

// void loop() {
//   checkForNFCCard();
//   handleDoubleTapDetection();
  
//   // Add your load cell reading logic here in future integration
//   // updateWeightReadings();
  
//   delay(100);
// }

// void initializeNFC() {
//   // Send initialization commands to HM-033
//   nfcSerial.write(0x55); // Wake up command
//   delay(100);
//   Serial.println("NFC Reader initialized");
// }

// void checkForNFCCard() {
//   if (nfcSerial.available()) {
//     String cardId = readNFCCard();
//     if (cardId.length() > 0) {
//       handleNFCTap(cardId);
//     }
//   }
// }

// String readNFCCard() {
//   String cardData = "";
//   while (nfcSerial.available()) {
//     char c = nfcSerial.read();
//     cardData += c;
//     delay(10);
//   }
  
//   // Process the card data based on HM-033 protocol
//   // You may need to adjust this based on the actual data format
//   if (cardData.length() > 0) {
//     Serial.println("Raw NFC data: " + cardData);
//     return extractCardId(cardData);
//   }
  
//   return "";
// }

// String extractCardId(String rawData) {
//   // Extract actual card ID from raw data
//   // This depends on HM-033 data format - adjust as needed
//   return rawData; // Simplified for now
// }

// void handleNFCTap(String cardId) {
//   // Check if it's a known card
//   int lorryIndex = getLorryIndex(cardId);
//   if (lorryIndex == -1) {
//     Serial.println("Unknown NFC card");
//     blinkLED(RED_LED, 3, 200);
//     return;
//   }
  
//   String lorryName = lorryNames[lorryIndex];
//   Serial.println("NFC card detected: " + lorryName);
  
//   // Handle double tap detection
//   unsigned long currentTime = millis();
//   if (currentTime - lastTapTime < 2000) {
//     tapCount++;
//     if (tapCount == 1) { // Second tap within 2 seconds
//       doubleTapDetected = true;
//       Serial.println("Double tap detected!");
//     }
//   } else {
//     tapCount = 0;
//     doubleTapDetected = false;
//   }
  
//   lastTapTime = currentTime;
  
//   // Process tap based on current state
//   processTap(lorryName, doubleTapDetected);
// }

// void processTap(String lorryName, bool isDoubleTap) {
//   switch (currentState) {
//     case IDLE:
//       if (isDoubleTap) {
//         // Double tap in idle = start unloading
//         startUnloading(lorryName);
//       } else {
//         // Single tap in idle = ready to load
//         startLoading(lorryName);
//       }
//       break;
      
//     case LOADING:
//       // Single tap during loading = finish loading
//       finishLoading();
//       break;
      
//     case UNLOADING:
//       // Single tap during unloading = finish unloading  
//       finishUnloading();
//       break;
      
//     default:
//       Serial.println("Invalid state for NFC tap");
//       break;
//   }
// }

// void startLoading(String lorryName) {
//   currentState = READY_TO_LOAD;
//   currentLorryId = lorryName;
  
//   digitalWrite(BLUE_LED, HIGH);
//   Serial.println("Ready to load - Lorry: " + lorryName);
//   Serial.println("Start loading bottles...");
  
//   // In full integration, call API: addnewloading
//   // callLoadingAPI(lorryName, "start");
  
//   // Transition to loading state
//   currentState = LOADING;
// }

// void finishLoading() {
//   currentState = IDLE;
//   currentLorryId = "";
  
//   digitalWrite(BLUE_LED, LOW);
//   digitalWrite(GREEN_LED, HIGH);
//   delay(2000);
//   digitalWrite(GREEN_LED, LOW);
  
//   Serial.println("Loading completed and submitted");
  
//   // In full integration, submit loading form
//   // callLoadingAPI(currentLorryId, "complete");
// }

// void startUnloading(String lorryName) {
//   currentState = READY_TO_UNLOAD;
//   currentLorryId = lorryName;
  
//   digitalWrite(RED_LED, HIGH);
//   Serial.println("Ready to unload - Lorry: " + lorryName);
//   Serial.println("Start unloading bottles...");
  
//   // In full integration, call API: addnewunloading  
//   // callUnloadingAPI(lorryName, "start");
  
//   // Transition to unloading state
//   currentState = UNLOADING;
// }

// void finishUnloading() {
//   currentState = IDLE;
//   currentLorryId = "";
  
//   digitalWrite(RED_LED, LOW);
//   digitalWrite(GREEN_LED, HIGH);
//   delay(2000);
//   digitalWrite(GREEN_LED, LOW);
  
//   Serial.println("Unloading completed and submitted");
  
//   // In full integration, submit unloading form
//   // callUnloadingAPI(currentLorryId, "complete");
// }

// int getLorryIndex(String cardId) {
//   for (int i = 0; i < 3; i++) {
//     if (knownCards[i] == cardId) {
//       return i;
//     }
//   }
//   return -1;
// }

// void handleDoubleTapDetection() {
//   // Reset double tap after processing
//   if (doubleTapDetected && millis() - lastTapTime > 2000) {
//     doubleTapDetected = false;
//     tapCount = 0;
//   }
// }

// void setAllLEDs(bool state) {
//   digitalWrite(BLUE_LED, state);
//   digitalWrite(GREEN_LED, state);
//   digitalWrite(RED_LED, state);
// }

// void blinkLED(int ledPin, int times, int delayMs) {
//   for (int i = 0; i < times; i++) {
//     digitalWrite(ledPin, HIGH);
//     delay(delayMs);
//     digitalWrite(ledPin, LOW);
//     delay(delayMs);
//   }
// }


#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Hardware pins
#define NFC_RX_PIN 16
#define NFC_TX_PIN 17
#define BLUE_LED 18
#define GREEN_LED 19
#define RED_LED 21

// NFC Communication
HardwareSerial nfcSerial(2); // Use UART2 for NFC communication

// System states
enum PalletState {
  IDLE,
  READY_TO_LOAD,
  LOADING,
  READY_TO_UNLOAD,
  UNLOADING
};

// Global variables
PalletState currentState = IDLE;
String currentLorryId = "";
unsigned long lastTapTime = 0;
int tapCount = 0;
bool doubleTapDetected = false;

// Known NFC card IDs (you'll need to scan these first)
String knownCards[3] = {
  "CARD_ID_1", // Replace with actual card IDs
  "CARD_ID_2",
  "CARD_ID_3"
};

String lorryNames[3] = {
  "Lorry_A",
  "Lorry_B", 
  "Lorry_C"
};

void setup() {
  Serial.begin(115200);
  nfcSerial.begin(9600);
  
  // Initialize LED pins
  pinMode(BLUE_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  
  // Turn off all LEDs initially
  setAllLEDs(false);
  
  Serial.println("NFC Pallet System Initialized");
  Serial.println("Tap NFC card to start...");
  
  // Initialize NFC reader
  initializeNFC();
}

void loop() {
  checkForNFCCard();
  handleDoubleTapDetection();
  
  // Add your load cell reading logic here in future integration
  // updateWeightReadings();
  
  delay(100);
}

void initializeNFC() {
  // Send initialization commands to HM-033
  nfcSerial.write(0x55); // Wake up command
  delay(100);
  Serial.println("NFC Reader initialized");
}

void checkForNFCCard() {
  if (nfcSerial.available()) {
    String cardId = readNFCCard();
    if (cardId.length() > 0) {
      handleNFCTap(cardId);
    }
  }
}

String readNFCCard() {
  String cardData = "";
  while (nfcSerial.available()) {
    char c = nfcSerial.read();
    cardData += c;
    delay(10);
  }
  
  // Process the card data based on HM-033 protocol
  // You may need to adjust this based on the actual data format
  if (cardData.length() > 0) {
    Serial.println("Raw NFC data: " + cardData);
    return extractCardId(cardData);
  }
  
  return "";
}

String extractCardId(String rawData) {
  // Extract actual card ID from raw data
  // This depends on HM-033 data format - adjust as needed
  return rawData; // Simplified for now
}

void handleNFCTap(String cardId) {
  // Check if it's a known card
  int lorryIndex = getLorryIndex(cardId);
  if (lorryIndex == -1) {
    Serial.println("Unknown NFC card");
    blinkLED(RED_LED, 3, 200);
    return;
  }
  
  String lorryName = lorryNames[lorryIndex];
  Serial.println("NFC card detected: " + lorryName);
  
  // Handle double tap detection
  unsigned long currentTime = millis();
  if (currentTime - lastTapTime < 2000) {
    tapCount++;
    if (tapCount == 1) { // Second tap within 2 seconds
      doubleTapDetected = true;
      Serial.println("Double tap detected!");
    }
  } else {
    tapCount = 0;
    doubleTapDetected = false;
  }
  
  lastTapTime = currentTime;
  
  // Process tap based on current state
  processTap(lorryName, doubleTapDetected);
}

void processTap(String lorryName, bool isDoubleTap) {
  switch (currentState) {
    case IDLE:
      if (isDoubleTap) {
        // Double tap in idle = start unloading
        startUnloading(lorryName);
      } else {
        // Single tap in idle = ready to load
        startLoading(lorryName);
      }
      break;
      
    case LOADING:
      // Single tap during loading = finish loading
      finishLoading();
      break;
      
    case UNLOADING:
      // Single tap during unloading = finish unloading  
      finishUnloading();
      break;
      
    default:
      Serial.println("Invalid state for NFC tap");
      break;
  }
}

void startLoading(String lorryName) {
  currentState = READY_TO_LOAD;
  currentLorryId = lorryName;
  
  digitalWrite(BLUE_LED, HIGH);
  Serial.println("Ready to load - Lorry: " + lorryName);
  Serial.println("Start loading bottles...");
  
  // In full integration, call API: addnewloading
  // callLoadingAPI(lorryName, "start");
  
  // Transition to loading state
  currentState = LOADING;
}

void finishLoading() {
  currentState = IDLE;
  currentLorryId = "";
  
  digitalWrite(BLUE_LED, LOW);
  digitalWrite(GREEN_LED, HIGH);
  delay(2000);
  digitalWrite(GREEN_LED, LOW);
  
  Serial.println("Loading completed and submitted");
  
  // In full integration, submit loading form
  // callLoadingAPI(currentLorryId, "complete");
}

void startUnloading(String lorryName) {
  currentState = READY_TO_UNLOAD;
  currentLorryId = lorryName;
  
  digitalWrite(RED_LED, HIGH);
  Serial.println("Ready to unload - Lorry: " + lorryName);
  Serial.println("Start unloading bottles...");
  
  // In full integration, call API: addnewunloading  
  // callUnloadingAPI(lorryName, "start");
  
  // Transition to unloading state
  currentState = UNLOADING;
}

void finishUnloading() {
  currentState = IDLE;
  currentLorryId = "";
  
  digitalWrite(RED_LED, LOW);
  digitalWrite(GREEN_LED, HIGH);
  delay(2000);
  digitalWrite(GREEN_LED, LOW);
  
  Serial.println("Unloading completed and submitted");
  
  // In full integration, submit unloading form
  // callUnloadingAPI(currentLorryId, "complete");
}

int getLorryIndex(String cardId) {
  for (int i = 0; i < 3; i++) {
    if (knownCards[i] == cardId) {
      return i;
    }
  }
  return -1;
}

void handleDoubleTapDetection() {
  // Reset double tap after processing
  if (doubleTapDetected && millis() - lastTapTime > 2000) {
    doubleTapDetected = false;
    tapCount = 0;
  }
}

void setAllLEDs(bool state) {
  digitalWrite(BLUE_LED, state);
  digitalWrite(GREEN_LED, state);
  digitalWrite(RED_LED, state);
}

void blinkLED(int ledPin, int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(ledPin, HIGH);
    delay(delayMs);
    digitalWrite(ledPin, LOW);
    delay(delayMs);
  }
}

