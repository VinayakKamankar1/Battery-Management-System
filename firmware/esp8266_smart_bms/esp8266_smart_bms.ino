#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_INA219.h>
#include <DHT.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <math.h>

// ============== WIFI CONFIGURATION ==============
const char* WIFI_SSID = "T4R";
const char* WIFI_PASSWORD = "";

// Firebase Realtime Database URL
const char* DATABASE_URL =
  "https://solar-80062-default-rtdb.firebaseio.com/";

// ============== PIN CONFIGURATION ==============
// NodeMCU ESP8266
#define DHT_PIN D7
#define DHT_TYPE DHT11

#define FAN_IN3 D1
#define FAN_IN4 D2
#define BUZZER_PIN D0

// Shared I2C bus for INA219 and OLED
#define I2C_SDA D5
#define I2C_SCL D6

// ============== OLED CONFIGURATION ==============
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDRESS 0x3C

Adafruit_SSD1306 display(
  SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1
);

// ============== SENSOR OBJECTS ==============
Adafruit_INA219 ina219;
DHT dht(DHT_PIN, DHT_TYPE);

bool ina219OK = false;
bool oledOK = false;

// ============== TEMPERATURE THRESHOLDS ==============
// Fan and buzzer active when temperature is above 30.0°C
const float FAN_ON_TEMP = 30.0;
const float FAN_OFF_TEMP = 28.0;

const float BUZZER_ON_TEMP = 30.0;
const float BUZZER_OFF_TEMP = 28.0;

const int DHT_FAIL_LIMIT = 3;

// ============== INTERVALS ==============
const unsigned long SENSOR_INTERVAL = 2000;
const unsigned long DISPLAY_INTERVAL = 1000;
const unsigned long UPLOAD_INTERVAL = 10000;
const unsigned long WIFI_RETRY_INTERVAL = 15000;

unsigned long lastSensorRead = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastUpload = 0;
unsigned long lastWiFiAttempt = 0;

// ============== SENSOR VALUES ==============
float voltageV = NAN;
float currentA = NAN;
float powerW = NAN;
float temperatureC = NAN;
float humidityPercent = NAN;

int dhtFailures = 0;
bool dhtReadingValid = false;

// ============== SYSTEM STATUS ==============
bool fanOn = false;
bool buzzerOn = false;

String deviceStatus = "Starting";
String firebaseStatus = "Not connected";

// ============== FAN CONTROL ==============
void setFan(bool on) {
  fanOn = on;

  // L298N direction control.
  // ENB jumper must be installed for full-speed operation.
  digitalWrite(FAN_IN3, on ? HIGH : LOW);
  digitalWrite(FAN_IN4, LOW);
}

// ============== BUZZER CONTROL ==============
void setBuzzer(bool on) {
  buzzerOn = on;
  digitalWrite(BUZZER_PIN, on ? HIGH : LOW);
}

// ============== PROTECTION LOGIC ==============
void updateProtection() {
  // Fail-safe when repeated DHT readings fail.
  if (dhtFailures >= DHT_FAIL_LIMIT) {
    setFan(true);
    setBuzzer(true);
    deviceStatus = "DHT Sensor Fault";
    return;
  }

  if (!dhtReadingValid || !isfinite(temperatureC)) {
    deviceStatus = "Waiting for DHT";
    return;
  }

  // Fan hysteresis
  if (temperatureC >= FAN_ON_TEMP) {
    setFan(true);
  } else if (temperatureC <= FAN_OFF_TEMP) {
    setFan(false);
  }

  // Buzzer hysteresis
  if (temperatureC >= BUZZER_ON_TEMP) {
    setBuzzer(true);
  } else if (temperatureC <= BUZZER_OFF_TEMP) {
    setBuzzer(false);
  }

  if (temperatureC >= BUZZER_ON_TEMP) {
    deviceStatus = "Critical Temperature";
  } else if (temperatureC >= FAN_ON_TEMP) {
    deviceStatus = "Temperature Warning";
  } else {
    deviceStatus = "Normal";
  }
}

// ============== WIFI CONNECTION ==============
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  unsigned long now = millis();

  if (lastWiFiAttempt != 0 &&
      now - lastWiFiAttempt < WIFI_RETRY_INTERVAL) {
    return;
  }

  lastWiFiAttempt = now;

  Serial.println("Connecting to Wi-Fi...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// ============== SENSOR READING ==============
void readSensors() {
  unsigned long now = millis();

  if (now - lastSensorRead < SENSOR_INTERVAL) {
    return;
  }

  lastSensorRead = now;

  // Read INA219 voltage, current and power.
  if (ina219OK) {
    float v = ina219.getBusVoltage_V();
    float i = ina219.getCurrent_mA() / 1000.0;
    float p = ina219.getPower_mW() / 1000.0;

    if (isfinite(v) && v >= 0 &&
        isfinite(i) && isfinite(p)) {
      voltageV = v;
      currentA = i;
      powerW = p;
    } else {
      voltageV = NAN;
      currentA = NAN;
      powerW = NAN;
    }
  } else {
    voltageV = NAN;
    currentA = NAN;
    powerW = NAN;
  }

  // Read DHT11 temperature and humidity.
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (isfinite(t) && isfinite(h) &&
      t >= 0 && t <= 80 &&
      h >= 0 && h <= 100) {

    temperatureC = t;
    humidityPercent = h;

    dhtReadingValid = true;
    dhtFailures = 0;

  } else {
    dhtReadingValid = false;
    dhtFailures++;

    Serial.print("DHT11 read failure: ");
    Serial.println(dhtFailures);
  }

  // Run local protection independently of Firebase.
  updateProtection();

  // Serial Monitor output.
  Serial.println();
  Serial.println("======= SMART BMS =======");

  Serial.print("INA219: ");
  Serial.println(ina219OK ? "Detected" : "NOT DETECTED");

  Serial.print("Voltage: ");
  if (isfinite(voltageV)) {
    Serial.printf("%.2f V\n", voltageV);
  } else {
    Serial.println("Sensor Error");
  }

  Serial.print("Current: ");
  if (isfinite(currentA)) {
    Serial.printf("%.3f A\n", currentA);
  } else {
    Serial.println("Sensor Error");
  }

  Serial.print("Power: ");
  if (isfinite(powerW)) {
    Serial.printf("%.3f W\n", powerW);
  } else {
    Serial.println("Sensor Error");
  }

  Serial.print("Temperature: ");
  if (dhtReadingValid) {
    Serial.printf("%.1f C\n", temperatureC);
  } else {
    Serial.println("Sensor Error");
  }

  Serial.print("Humidity: ");
  if (dhtReadingValid) {
    Serial.printf("%.1f %%\n", humidityPercent);
  } else {
    Serial.println("Sensor Error");
  }

  Serial.printf("Fan: %s\n", fanOn ? "ON" : "OFF");
  Serial.printf("Buzzer: %s\n", buzzerOn ? "ON" : "OFF");
  Serial.print("System Status: ");
  Serial.println(deviceStatus);
}

// ============== PROFESSIONAL OLED DISPLAY ==============
void updateOLED() {
  if (!oledOK) {
    return;
  }

  unsigned long now = millis();

  if (now - lastDisplayUpdate < DISPLAY_INTERVAL) {
    return;
  }

  lastDisplayUpdate = now;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  // Header
  display.setCursor(0, 0);
  display.print("SMART BMS");

  display.setCursor(84, 0);
  display.print(
    WiFi.status() == WL_CONNECTED ? "WiFi:OK" : "WiFi:--"
  );

  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  // Voltage and current labels
  display.setCursor(0, 13);
  display.print("VOLTAGE");

  display.setCursor(68, 13);
  display.print("CURRENT");

  // Voltage value
  display.setCursor(0, 23);
  if (isfinite(voltageV)) {
    display.print(voltageV, 2);
    display.print(" V");
  } else {
    display.print("ERROR");
  }

  // Current value
  display.setCursor(68, 23);
  if (isfinite(currentA)) {
    display.print(currentA, 3);
    display.print(" A");
  } else {
    display.print("ERROR");
  }

  // Power and temperature labels
  display.setCursor(0, 35);
  display.print("POWER");

  display.setCursor(68, 35);
  display.print("TEMP");

  // Power value
  display.setCursor(0, 45);
  if (isfinite(powerW)) {
    display.print(powerW, 2);
    display.print(" W");
  } else {
    display.print("--");
  }

  // Temperature value
  display.setCursor(68, 45);
  if (dhtReadingValid) {
    display.print(temperatureC, 1);
    display.print(" C");
  } else {
    display.print("DHT ERROR");
  }

  // Bottom line: humidity, fan and database status.
  // Buzzer status is intentionally not displayed.
  display.setCursor(0, 57);

  display.print("H:");
  if (dhtReadingValid) {
    display.print(humidityPercent, 0);
    display.print("%");
  } else {
    display.print("--");
  }

  display.print(" F:");
  display.print(fanOn ? "ON" : "OFF");

  display.print(" DB:");
  display.print(
    firebaseStatus == "Connected" ? "OK" : "--"
  );

  display.display();
}

// ============== JSON HELPERS ==============
String jsonNumber(float value, int decimals) {
  if (!isfinite(value)) {
    return "null";
  }

  return String(value, decimals);
}

// Build JSON without inventing readings for failed sensors.
String makeJSON() {
  String json = "{";

  json += "\"voltage_V\":" + jsonNumber(voltageV, 3);
  json += ",\"current_A\":" + jsonNumber(currentA, 3);
  json += ",\"power_W\":" + jsonNumber(powerW, 3);
  json += ",\"temperature_C\":" +
          jsonNumber(temperatureC, 1);
  json += ",\"humidity_percent\":" +
          jsonNumber(humidityPercent, 1);

  json += ",\"fan_status\":\"";
  json += fanOn ? "ON" : "OFF";
  json += "\"";

  json += ",\"buzzer_status\":\"";
  json += buzzerOn ? "ON" : "OFF";
  json += "\"";

  json += ",\"ina219_status\":\"";
  json += (ina219OK && isfinite(voltageV) &&
           isfinite(currentA)) ? "OK" : "ERROR";
  json += "\"";

  json += ",\"dht11_status\":\"";
  json += dhtReadingValid ? "OK" : "ERROR";
  json += "\"";

  json += ",\"oled_status\":\"";
  json += oledOK ? "OK" : "ERROR";
  json += "\"";

  json += ",\"wifi_status\":\"";
  json += WiFi.status() == WL_CONNECTED
            ? "Connected" : "Disconnected";
  json += "\"";

  json += ",\"device_status\":\"" + deviceStatus + "\"";
  json += ",\"uptime_ms\":" + String(millis());

  json += "}";

  return json;
}

// ============== FIREBASE REST WRITE ==============
bool firebaseWrite(
  const String& path,
  const String& payload,
  bool appendHistory
) {
  if (WiFi.status() != WL_CONNECTED) {
    firebaseStatus = "WiFi disconnected";
    return false;
  }

  WiFiClientSecure client;

  // Prototype testing only.
  // Production deployments should validate TLS certificates.
  client.setInsecure();
  client.setTimeout(3000);

  HTTPClient https;
  String url = String(DATABASE_URL) + path + ".json";

  if (!https.begin(client, url)) {
    firebaseStatus = "HTTPS error";
    Serial.println("Firebase HTTPS connection failed");
    return false;
  }

  https.setTimeout(4000);
  https.addHeader("Content-Type", "application/json");

  int code;

  if (appendHistory) {
    code = https.POST(payload);
  } else {
    code = https.PUT(payload);
  }

  String response = https.getString();

  Serial.print("Firebase HTTP code: ");
  Serial.println(code);

  if (code >= 200 && code < 300) {
    firebaseStatus = "Connected";
  } else {
    firebaseStatus = "Write failed";

    Serial.print("Firebase response: ");
    Serial.println(response);
  }

  https.end();

  return code >= 200 && code < 300;
}

// ============== FIREBASE UPLOAD ==============
void uploadFirebase() {
  unsigned long now = millis();

  if (now - lastUpload < UPLOAD_INTERVAL) {
    return;
  }

  lastUpload = now;

  if (WiFi.status() != WL_CONNECTED) {
    firebaseStatus = "WiFi disconnected";
    return;
  }

  String payload = makeJSON();

  bool latest = firebaseWrite(
    "/smart_bms/latest",
    payload,
    false
  );

  bool history = firebaseWrite(
    "/smart_bms/readings",
    payload,
    true
  );

  if (latest && history) {
    firebaseStatus = "Connected";
    Serial.println("Firebase upload successful");
  }
}

// ============== SETUP ==============
void setup() {
  Serial.begin(115200);
  delay(100);

  // Configure outputs.
  pinMode(FAN_IN3, OUTPUT);
  pinMode(FAN_IN4, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Initial safe output states.
  digitalWrite(FAN_IN3, LOW);
  digitalWrite(FAN_IN4, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize the shared I2C bus once.
  Wire.begin(I2C_SDA, I2C_SCL);

  Serial.println();
  Serial.println("SMART BMS STARTUP");

  // Initialize INA219.
  ina219OK = ina219.begin();

  Serial.println(
    ina219OK
      ? "INA219 detected"
      : "ERROR: INA219 not detected"
  );

  // Initialize OLED.
  oledOK = display.begin(
    SSD1306_SWITCHCAPVCC,
    OLED_ADDRESS
  );

  Serial.println(
    oledOK
      ? "OLED detected"
      : "ERROR: OLED not detected"
  );

  if (oledOK) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);

    display.println("SMART BMS");
    display.println("----------------");
    display.println("Initializing...");
    display.display();
  }

  // Initialize DHT11.
  dht.begin();
  Serial.println("DHT11 initialized");

  // Start Wi-Fi connection.
  connectWiFi();
}

// ============== MAIN LOOP ==============
void loop() {
  connectWiFi();

  // Sensor monitoring and protection run locally.
  readSensors();

  // Update OLED independently of Firebase.
  updateOLED();

  // Upload readings when Wi-Fi is available.
  uploadFirebase();

  // Allow ESP8266 Wi-Fi background processing.
  yield();
}
