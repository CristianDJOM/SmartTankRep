import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { UserType } from "../UserContext";
import { Picker } from "@react-native-picker/picker";
import Notification from "../error";
import Notificacion from "../Notificacion";
import { Ionicons } from "@expo/vector-icons";
import Fontisto from "@expo/vector-icons/Fontisto";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import logo from "../assets/Logo.png";

export default function App() {
  const { userId, setUserId } = useContext(UserType);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [dispositivosGuardados, setdispositivosGuardados] = useState("");
  const [tipoTanque, setTipoTanque] = useState("Cilindrico"); // 'cilindrico' o 'rectangular'
  const [separacionD, setseparacionD] = useState("");
  const [altura, setAltura] = useState("");
  const [ancho, setAncho] = useState("");
  const [anchoS, setAnchoS] = useState("");
  const [anchoB, setAnchoB] = useState("");

  const [visible, setVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [visibleN, setVisibleN] = useState(false);
  const [snackbarMessageN, setSnackbarMessageN] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const navigation = useNavigation();
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "black",
              marginTop: 5,
              marginBottom: 5,
            }}
          >
            Registrar Dispositivo
          </Text>
        </View>
      ),
    });
  }, [navigation]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`https://smarttankapi.onrender.com/Dispositivos/${userId}`);
      const data = await res.json();
      setdispositivosGuardados(data);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener dispositivos:", error);
      setError("Error al cargar los dispositivos.");
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const enviarConfiguracion = async () => {
    if (tipoTanque === "Cilindrico") {
      if (
        !ssid ||
        !password ||
        !altura ||
        !ancho ||
        !separacionD ||
        !deviceName
      ) {
        setSnackbarMessage("Error, Por favor completa todos los campos");
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
        return;
      }
    }
    if (tipoTanque === "Conico") {
      if (
        !ssid ||
        !password ||
        !altura ||
        !anchoS ||
        !anchoB ||
        !separacionD ||
        !deviceName
      ) {
        setSnackbarMessage("Error, Por favor completa todos los campos");
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
        return;
      }
    }

    try {
      // Calcular el número máximo de los IDs del usuario
      let maxNumber = 0;
      dispositivosGuardados.forEach((d) => {
        const regex = new RegExp(`^${userId}disp_(\\d+)$`);
        const match = d.idDispositivo.match(regex);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) maxNumber = num;
        }
      });

      const nuevoDeviceId = `${userId}disp_${maxNumber + 1}`;
      setDeviceId(nuevoDeviceId); // Por si quieres mostrarlo luego

      // Verificar si el ID o el nombre ya existen
      const idExistente = dispositivosGuardados.find(
        (d) => d.idDispositivo.toLowerCase() === nuevoDeviceId.toLowerCase()
      );
      const nombreExistente = dispositivosGuardados.find(
        (d) => d.deviceName.toLowerCase() === deviceName.toLowerCase()
      );

      if (idExistente) {
        setSnackbarMessage("Error: Ya existe un dispositivo con ese ID.");
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
        return;
      }

      if (nombreExistente) {
        setSnackbarMessage("Error: Ya existe un dispositivo con ese nombre.");
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
        return;
      }

      // Enviar la configuración al ESP32
      const response = await fetch("http://192.168.4.1/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ssid,
          password,
          altura: parseInt(altura),
          tipoTanque,
          ancho: parseInt(ancho),
          anchoS: parseInt(anchoS),
          anchoB: parseInt(anchoB),
          separacionD: parseInt(separacionD),
          id: nuevoDeviceId,
          idUsuario: userId,
          deviceName: deviceName,
        }),
      });

      const resText = await response.text();

      if (response.ok) {
        setSsid("");
        setPassword("");
        setAltura("");
        setDeviceId("");
        setDeviceName("");
        setSnackbarMessageN(
          "Éxito, Configuración enviada correctamente. El ESP32 se reiniciará."
        );
        setVisibleN(true);
        setTimeout(() => setVisibleN(false), 5000);
      } else {
        setSnackbarMessage(
          resText || "Error: No se pudo enviar la configuración."
        );
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
      }
    } catch (error) {
      setSnackbarMessage(
        "Error de conexión",
        '¿Estás conectado al WiFi "ConfigESP32"?\n\n' + error.message
      );
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }
  };

  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const onRefresh = async () => {
    fetchUserProfile();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Notification
        message={snackbarMessage}
        visible={visible}
        onClose={() => setVisible(false)}
      />
      <Notificacion
        message={snackbarMessageN}
        visible={visibleN}
        onClose={() => setVisibleN(false)}
      />
      <ScrollView style={{ backgroundColor: "rgb(242, 247, 250)", flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center" }}>
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={logo}
              style={{
                width: "95%",
                height: 250,
                resizeMode: "contain",
              }}
            />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "bold",
                color: "black",
              }}
            >
              Registre un Nuevo Dispositivo
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#46a7fd",
              width: "95%",
              marginTop: 10,
              alignItems: "center",
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: "white",
                marginTop: 5,
                marginBottom: 5,
              }}
            >
              Informacion de la red
            </Text>
          </View>

          <View
            style={{
              marginTop: 8,
              marginBottom: 15,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={styles.input}>
              <Ionicons
                style={{ marginLeft: 10 }}
                name="wifi-outline"
                size={24}
                color="#0263b9"
              />
              <TextInput
                value={ssid}
                onChangeText={(text) => setSsid(text)}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "80%",
                  fontSize: 16,
                }}
                placeholder="SSID de tu WiFi"
              />
            </View>

            <View style={styles.input}>
              <Fontisto
                name="locked"
                size={24}
                color="#0263b9"
                style={{ marginLeft: 10 }}
              />
              <TextInput
                value={password}
                onChangeText={(text) => setPassword(text)}
                secureTextEntry={secureTextEntry}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "70%",
                  fontSize: 16,
                }}
                placeholder="Contraseña del WiFi"
              />
              <TouchableOpacity
                style={{
                  width: "20%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={togglePasswordVisibility}
              >
                <FontAwesome5
                  name={secureTextEntry ? "eye" : "eye-slash"}
                  size={24}
                  color="#0263b9"
                />
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: "#46a7fd",
                width: "95%",
                marginTop: 10,
                alignItems: "center",
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "white",
                  marginTop: 5,
                  marginBottom: 5,
                }}
              >
                Informacion del tanque
              </Text>
            </View>

            <View style={styles.input}>
              <MaterialIcons
                style={{ marginLeft: 10 }}
                name="height"
                size={24}
                color="#0263b9"
              />

              <TextInput
                value={altura}
                onChangeText={(number) => {
                  const onlyNumbers = number.replace(/[^0-9]/g, "");
                  setAltura(onlyNumbers);
                }}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "80%",
                  fontSize: 16,
                }}
                placeholder="Altura del tanque (cm)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.input}>
              <View
                style={{
                  marginVertical: 10,
                  width: "45%",
                  marginLeft: 10,
                }}
              >
                <Text
                  style={{ color: "gray", fontSize: 14, fontWeight: "bold" }}
                >
                  Forma del Tanque:{" "}
                </Text>
              </View>
              <View style={{ width: "50%", height: 50, marginRight: "5%" }}>
                <View
                  style={{
                    borderBottomWidth: 1.5,
                    borderBottomColor: "#0263b9",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Picker
                    selectedValue={tipoTanque}
                    mode="dropdown"
                    style={styles.picker}
                    onValueChange={(itemValue, itemIndex) =>
                      setTipoTanque(itemValue)
                    }
                  >
                    <Picker.Item label="Cilindrico" value="Cilindrico" />
                    <Picker.Item label="Conico" value="Conico" />
                    <Picker.Item label="Cuadrada" value="Cuadrada" />
                    <Picker.Item label="Rectangular" value="Rectangular" />
                  </Picker>
                </View>
              </View>
            </View>

            {tipoTanque === "Cilindrico" && (
              <View style={styles.input}>
                <MaterialIcons
                  style={{ marginLeft: 10 }}
                  name="radio-button-checked"
                  size={24}
                  color="#0263b9"
                />
                <TextInput
                  value={ancho}
                  onChangeText={(number) => {
                    const onlyNumbers = number.replace(/[^0-9]/g, "");
                    setAncho(onlyNumbers);
                  }}
                  style={{
                    color: "black",
                    marginVertical: 10,
                    width: "80%",
                    fontSize: 16,
                  }}
                  placeholder="Diámetro del tanque (cm)"
                  keyboardType="numeric"
                />
              </View>
            )}

            {tipoTanque === "Conico" && (
              <>
                <View style={styles.input}>
                  <MaterialIcons
                    style={{ marginLeft: 10 }}
                    name="radio-button-checked"
                    size={24}
                    color="#0263b9"
                  />
                  <TextInput
                    value={anchoS}
                    onChangeText={(number) => {
                      const onlyNumbers = number.replace(/[^0-9]/g, "");
                      setAnchoS(onlyNumbers);
                    }}
                    style={{
                      color: "black",
                      marginVertical: 10,
                      width: "80%",
                      fontSize: 16,
                    }}
                    placeholder="Diámetro superior del tanque (cm)"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.input}>
                  <MaterialIcons
                    style={{ marginLeft: 10 }}
                    name="radio-button-checked"
                    size={24}
                    color="#0263b9"
                  />
                  <TextInput
                    value={anchoB}
                    onChangeText={(number) => {
                      const onlyNumbers = number.replace(/[^0-9]/g, "");
                      setAnchoB(onlyNumbers);
                    }}
                    style={{
                      color: "black",
                      marginVertical: 10,
                      width: "80%",
                      fontSize: 16,
                    }}
                    placeholder="Diámetro inferior del tanque (cm)"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <View style={styles.input}>
              <MaterialIcons
                style={{ marginLeft: 10 }}
                name="height"
                size={24}
                color="#0263b9"
              />

              <TextInput
                value={separacionD}
                onChangeText={(number) => {
                  const onlyNumbers = number.replace(/[^0-9]/g, "");
                  setseparacionD(onlyNumbers);
                }}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "80%",
                  fontSize: 16,
                }}
                placeholder="Separacion del sensor (cm)"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.input}>
              <MaterialIcons
                style={{ marginLeft: 10 }}
                name="device-hub"
                size={24}
                color="#0263b9"
              />

              <TextInput
                value={deviceName}
                onChangeText={(text) => setDeviceName(text)}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "80%",
                  fontSize: 16,
                }}
                placeholder="Nombre del dispositivo"
              />
            </View>
          </View>



          

          <TouchableOpacity
            onPress={enviarConfiguracion}
            style={{
              width: 150,
              backgroundColor: "#0263b9",
              borderRadius: 10,
              marginLeft: "auto",
              marginRight: "auto",
              height: 50,
              marginTop: 10,
              marginBottom: 20,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              Registrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E6E8EB",
    width: "95%",
    height: 70,
    borderRadius: 10,
    elevation: 5,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginLeft: 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(242, 247, 250)",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgb(242, 247, 250)",
  },
  errorText: { fontSize: 16, color: "red", textAlign: "center" },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
