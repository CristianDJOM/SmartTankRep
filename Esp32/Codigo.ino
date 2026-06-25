#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>

#define TRIG_PIN 13
#define ECHO_PIN 12
#define BUTTON_PIN 14 // Pin del botón de reinicio
#define LED_PIN 15 // Indicador

WebServer server(80);
Preferences preferences;

String ssid, password, tipoTanque, deviceName, idDispositivo, idUsuario;
int alturaTanqueCM = 0;
int ancho = 0;
int anchoS = 0;
int anchoB = 0;
int separacionD = 0;

const char* dataServer = "https://smarttankapi.onrender.com/nivel";
const char* dataServerRegistrar = "https://smarttankapi.onrender.com/registro";
unsigned long sampleInterval = 10000;
unsigned long lastSampleTime = 0;
unsigned long buttonPressStartTime = 0;
bool isButtonPressed = false;
bool modoConfiguracion = false;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP); // Configura el botón como entrada con resistencia pull-up
  pinMode(LED_PIN, OUTPUT);

  preferences.begin("wifiConfig", false);
  ssid = preferences.getString("ssid", "");
  password = preferences.getString("password", "");
  tipoTanque = preferences.getString("tipoTanque", ""); 
  alturaTanqueCM = preferences.getInt("altura", 0);
  ancho = preferences.getInt("ancho", 0);
  anchoS = preferences.getInt("anchoS", 0);
  anchoB = preferences.getInt("anchoB", 0);
  separacionD = preferences.getInt("separacionD", 0);
  idDispositivo = preferences.getString("id", "");       
  idUsuario = preferences.getString("idUsuario", "");    
  preferences.end();

  if (tipoTanque == "" || idDispositivo == "") {
    digitalWrite(LED_PIN, HIGH); 
    iniciarModoConfiguracion();
  } else {
    conectarWiFiYComenzar();
  }
}

void loop() {
  server.handleClient();

  if (modoConfiguracion) {
    static unsigned long lastBlink = 0;
    static bool ledState = false;
    if (millis() - lastBlink > 500) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      lastBlink = millis();
    }
  }

  if (digitalRead(BUTTON_PIN) == LOW) {
    if (!isButtonPressed) {
      buttonPressStartTime = millis();
      isButtonPressed = true;
    } else if (millis() - buttonPressStartTime >= 3000) {
      reiniciarConfiguracion();
    }
  } else {
    isButtonPressed = false;
  }

  if (WiFi.status() == WL_CONNECTED && alturaTanqueCM > 0 && millis() - lastSampleTime > sampleInterval) {
    int distancia = medirDistancia();
    int distanciaMaxima = alturaTanqueCM + separacionD;
    distancia = constrain(distancia, 0, distanciaMaxima);

    // Calcular altura útil de agua considerando el punto muerto
    float alturaAgua = distanciaMaxima - distancia;
    alturaAgua = constrain(alturaAgua, 0, alturaTanqueCM);

    float volumenLitros = 0.0;
    float volumenTotal = 0.0;
    float porcentaje = 0.0;

    if (tipoTanque == "Cilindrico") {
      float radio = ancho / 2.0;
      volumenLitros = PI * radio * radio * alturaAgua * 0.001;
      volumenTotal = PI * radio * radio * alturaTanqueCM * 0.001;
    } else if (tipoTanque == "Conico") {
      float R1 = anchoS / 2.0;
      float R2 = anchoB / 2.0;
      volumenLitros = (PI * alturaAgua * (R1 * R1 + R1 * R2 + R2 * R2)) / 3.0 * 0.001;
      volumenTotal = (PI * alturaTanqueCM * (R1 * R1 + R1 * R2 + R2 * R2)) / 3.0 * 0.001;
    }

    if (volumenTotal > 0) {
      porcentaje = (volumenLitros / volumenTotal) * 100.0;
    }

    Serial.printf("Distancia: %.2f cm\n", distancia);
    Serial.printf("Altura agua: %.2f cm\n", alturaAgua);
    Serial.printf("Volumen actual: %.2f L\n", volumenLitros);
    Serial.printf("Volumen total: %.2f L\n", volumenTotal);
    Serial.printf("Porcentaje: %.2f %%\n", porcentaje);

    // Enviar el volumen en litros como nivel
    enviarNivel(volumenLitros, porcentaje);
    lastSampleTime = millis();
  }
}

void iniciarModoConfiguracion() {
  modoConfiguracion = true;
  WiFi.softAP("ConfigESP32");

  server.on("/config", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      DynamicJsonDocument doc(256);
      Serial.println(server.arg("plain"));
      deserializeJson(doc, server.arg("plain"));

      ssid = doc["ssid"].as<String>();
      password = doc["password"].as<String>();
      deviceName = doc["deviceName"].as<String>();
      tipoTanque = doc["tipoTanque"].as<String>();
      alturaTanqueCM = doc["altura"];
      ancho = doc["ancho"];
      anchoS = doc["anchoS"];
      anchoB = doc["anchoB"];
      separacionD = doc["separacionD"];
      idDispositivo = doc["id"].as<String>();
      idUsuario = doc["idUsuario"].as<String>();

      // Intentar conexión con los datos recibidos sin guardar todavía
      WiFi.begin(ssid.c_str(), password.c_str());
      unsigned long start = millis();
      bool connected = false;

      while (millis() - start < 10000) { // Esperamos máximo 10 segundos
        if (WiFi.status() == WL_CONNECTED) {
          connected = true;
          break;
        }
        delay(500);
      }

      if (connected) {
        if (tipoTanque == "Cilindrico"){
          HTTPClient http;
          http.begin(dataServerRegistrar);
          http.addHeader("Content-Type", "application/json");

          DynamicJsonDocument doc(128);
          doc["ssid"] = ssid;
          doc["password"] = password;
          doc["deviceName"] = deviceName;
          doc["tipoTanque"] = tipoTanque;
          doc["alturaTanqueCM"] = alturaTanqueCM;
          doc["ancho"] = ancho;
          doc["idDispositivo"] = idDispositivo;
          doc["idUsuario"] = idUsuario;
          
          String payload;
          serializeJson(doc, payload);

          int res = http.POST(payload);
          if (res > 0) {
            Serial.println("Datos enviados correctamente.");
            Serial.println(payload);
            // Guardar si se registra exitosamente
            preferences.begin("wifiConfig", false);
            preferences.putString("ssid", ssid);
            preferences.putString("password", password);
            preferences.putString("tipoTanque", tipoTanque);
            preferences.putInt("altura", alturaTanqueCM);
            preferences.putInt("ancho", ancho);
            preferences.putInt("separacionD", separacionD);
            preferences.putString("id", idDispositivo);
            preferences.end();
            
            server.send(200, "text/plain", "Conectado y configuración guardada. Reiniciando...");
            delay(2000);
            ESP.restart();
          } else {
            Serial.printf("Error al enviar datos. Código HTTP: %d\n", res);
            String reason = "No se pudo Registrar el dispositivo error de servidor.";
            server.send(400, "text/plain", reason);
            WiFi.disconnect(true);
          }
          http.end();
        }
        if (tipoTanque == "Conico"){

          HTTPClient http;
          http.begin(dataServerRegistrar);
          http.addHeader("Content-Type", "application/json");

          DynamicJsonDocument doc(128);
          doc["ssid"] = ssid;
          doc["password"] = password;
          doc["deviceName"] = deviceName;
          doc["tipoTanque"] = tipoTanque;
          doc["alturaTanqueCM"] = alturaTanqueCM;
          doc["anchoS"] = anchoS;
          doc["anchoB"] = anchoB;
          doc["idDispositivo"] = idDispositivo;
          doc["idUsuario"] = idUsuario;
          
          String payload;
          serializeJson(doc, payload);

          int res = http.POST(payload);
          if (res > 0) {
            Serial.println("Datos enviados correctamente.");
            Serial.println(payload);
            // Guardar si se registra exitosamente
            preferences.begin("wifiConfig", false);
            preferences.putString("ssid", ssid);
            preferences.putString("password", password);
            preferences.putString("tipoTanque", tipoTanque);
            preferences.putInt("altura", alturaTanqueCM);
            preferences.putInt("anchoS", anchoS);
            preferences.putInt("anchoB", anchoB);
            preferences.putInt("separacionD", separacionD);
            preferences.putString("id", idDispositivo);
            preferences.end();

            server.send(200, "text/plain", "Conectado y configuración guardada. Reiniciando...");
            delay(2000);
            ESP.restart();
          } else {
            Serial.printf("Error al enviar datos. Código HTTP: %d\n", res);
            String reason = "No se pudo Registrar el dispositivo error de servidor.";
            server.send(400, "text/plain", reason);
            WiFi.disconnect(true);
          }
          http.end();
        }
      } else {
        // No se conectó: no se guarda nada y se avisa
        String reason = "No se pudo conectar al WiFi. Verifica el nombre de red (SSID) o la contraseña.";
        server.send(400, "text/plain", reason);
        WiFi.disconnect(true);
      }
    } else {
      server.send(400, "text/plain", "Faltan datos.");
    }
  });

  server.begin();
  Serial.println("Modo configuración activo. Conéctate al AP 'ConfigESP32'");
}

void conectarWiFiYComenzar() {
  WiFi.begin(ssid.c_str(), password.c_str());
  Serial.print("Conectando a red: ");
  Serial.println(ssid);

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("ID del dispositivo: ");
    Serial.println(idDispositivo);
    server.begin();
  } else {
    Serial.println("\nFallo al conectar. Reiniciando modo configuración...");
    preferences.begin("wifiConfig", false);
    preferences.clear();
    preferences.end();
    ESP.restart();
  }
}

void reiniciarConfiguracion() {
  Serial.println("Reiniciando configuración...");
  preferences.begin("wifiConfig", false);
  preferences.clear();  // Borra la configuración almacenada
  preferences.end();

  ESP.restart();  // Reinicia el ESP32
}

int medirDistancia() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duracion = pulseIn(ECHO_PIN, HIGH);
  return duracion * 0.034 / 2;
}

void enviarNivel(float volumenLitros, int porcentaje) {
  if (idDispositivo == "") {
    Serial.println("ID del dispositivo no configurado.");
    return;
  }

  HTTPClient http;
  http.begin(dataServer);
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(256);  // Aumenta el tamaño si es necesario
  doc["id"] = idDispositivo;     // string
  doc["nivel"] = volumenLitros; // float
  doc["porcentaje"] = porcentaje; // int

  String payload;
  serializeJson(doc, payload);

  int res = http.POST(payload);
  if (res > 0) {
    Serial.println("Datos enviados correctamente.");
    Serial.println(payload);
  } else {
    Serial.printf("Error al enviar datos. Código HTTP: %d\n", res);
  }

  http.end();
}
