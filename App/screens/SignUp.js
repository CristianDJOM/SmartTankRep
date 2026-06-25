import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import Notification from "../error";
import Notificacion from "../Notificacion";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { FontAwesome } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Fontisto from "@expo/vector-icons/Fontisto";
import LottieView from "lottie-react-native";
import logo from "../assets/Logo.png";

const SingUp = () => {
  const navigation = useNavigation();

  const [name, setname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setpassword] = useState("");
  const [confirmpassword, setconfirmpassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureTextEntryC, setSecureTextEntryC] = useState(true);

  const [visible, setVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [visibleN, setVisibleN] = useState(false);
  const [snackbarMessageN, setSnackbarMessageN] = useState("");

  const Registar = async () => {
    if (!name && !phone && !email && !password) {
      setSnackbarMessage("Por favor, complete el formulario");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }
    if (!name) {
      setSnackbarMessage("Por favor, Ingrese el nombre del usuario");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }
    if (!phone) {
      setSnackbarMessage("Por favor, Ingrese el numero del usuario");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }
    if (!email) {
      setSnackbarMessage("Por favor, Ingrese el correo del usuario");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      setSnackbarMessage("El correo debe ser un Gmail válido");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }
    if (!password) {
      setSnackbarMessage("Por favor, Ingrese una contraseña del usuario");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setSnackbarMessage(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial"
      );
      setVisible(true);
      setTimeout(() => setVisible(false), 10000);
      return;
    }
    if (confirmpassword != password) {
      setSnackbarMessage("Las contraseñas no coinciden. ");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }
    const NuevoUsuario = {
      name: name,
      phone: phone,
      email: email,
      password: password,
    };

    axios
      .post("https://smarttankapi.onrender.com/registrar/Usuario", NuevoUsuario)
      .then((response) => {
        if (response.status === 201 && response.data.message) {
          setSnackbarMessageN(
            "Registro exitoso",
            "Te has registrado exitosamente"
          );
          setVisibleN(true);
          setTimeout(() => setVisibleN(false), 5000);
        } else {
          setSnackbarMessageN(
            "Error inesperado",
            "La operación no se completó."
          );
          setVisibleN(true);
          setTimeout(() => setVisibleN(false), 5000);
        }
        setname("");
        setPhone("");
        setEmail("");
        setpassword("");
        setconfirmpassword("");
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          setSnackbarMessage(error.response.data.message);
        } else {
          setSnackbarMessage(
            "Error de registro, Ocurrió un error al registrarse"
          );
        }
        setTimeout(() => setVisible(false), 5000);
      });
  };

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
      <ScrollView style={{ backgroundColor: "white", flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", marginTop: "8%" }}>
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
              Registrar nueva cuenta
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
                name="person"
                size={24}
                color="#0263b9"
              />
              <TextInput
                value={name}
                onChangeText={(text) => setname(text)}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "80%",
                  fontSize: 16,
                }}
                placeholder="Nombre del Usuario"
              />
            </View>

            <View style={styles.input}>
              <FontAwesome
                style={{ marginLeft: 10 }}
                name="mobile-phone"
                size={40}
                color="#0263b9"
              />

              <TextInput
                value={phone}
                onChangeText={(number) => {
                  const onlyNumbers = number.replace(/[^0-9]/g, ""); // Permitir solo números positivos
                  setPhone(onlyNumbers);
                }}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "80%",
                  fontSize: 16,
                }}
                placeholder="Número de Teléfono"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.input}>
              <MaterialIcons
                name="email"
                size={28}
                color="#0263b9"
                style={{ marginLeft: 10 }}
              />
              <TextInput
                value={email}
                onChangeText={(text) => setEmail(text)}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "80%",
                  fontSize: 16,
                }}
                placeholder="Correo Electronico"
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
                onChangeText={(text) => setpassword(text)}
                secureTextEntry={secureTextEntry}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "70%",
                  fontSize: 16,
                }}
                placeholder="Ingrese su contraseña"
              />

              <TouchableOpacity
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                style={{
                  width: "20%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesome5
                  name={secureTextEntry ? "eye" : "eye-slash"}
                  size={24}
                  color="#0263b9"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.input}>
              <Fontisto
                name="locked"
                size={24}
                color="#0263b9"
                style={{ marginLeft: 10 }}
              />

              <TextInput
                value={confirmpassword}
                onChangeText={(text) => setconfirmpassword(text)}
                secureTextEntry={secureTextEntryC}
                style={{
                  color: "black",
                  marginVertical: 10,
                  width: "70%",
                  fontSize: 16,
                }}
                placeholder="Confirme su contraseña"
              />

              <TouchableOpacity
                onPress={() => setSecureTextEntryC(!secureTextEntryC)}
                style={{
                  width: "20%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesome5
                  name={secureTextEntryC ? "eye" : "eye-slash"}
                  size={24}
                  color="#0263b9"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={Registar}
            style={{
              width: 200,
              backgroundColor: "#0263b9",
              borderRadius: 10,
              marginLeft: "auto",
              marginRight: "auto",
              padding: 15,
              marginTop: 10,
              marginBottom: 20,
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
          <TouchableOpacity
            onPress={() => navigation.replace("Login")}
            style={{ marginTop: 15 }}
          >
            <Text
              style={{
                textAlign: "center",
                color: "gray",
                fontSize: 16,
                marginBottom: 50,
              }}
            >
              ¿Ya tienes una cuenta?{" "}
              <Text style={{ color: "#007FFF", fontWeight: "500" }}>
                Iniciar sesión
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SingUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6E8EB",
    gap: 5,
    width: "95%",
    height: 70,
    borderRadius: 10,
    elevation: 5,
    paddingHorizontal: 10,
    marginVertical: 6,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginLeft: 10,
  },
  sign: {
    alignItems: "center",
  },
  neonText: {
    fontSize: 55,
    fontWeight: "bold",
    color: "#0263b9",
    textAlign: "center",
    textShadowColor: "rgb(65, 150, 230)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  animation: {
    width: "60%",
    height: "15%",
  },
});
