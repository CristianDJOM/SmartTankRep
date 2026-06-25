import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Notification from "../error";
import Notificacion from "../Notificacion";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Fontisto from "@expo/vector-icons/Fontisto";
import logo from "../assets/Logo.png";

const Login = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setpassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const [visible, setVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [visibleN, setVisibleN] = useState(false);
  const [snackbarMessageN, setSnackbarMessageN] = useState("");

  const Iniciar = async () => {
    if (!email && !password) {
      setSnackbarMessage("Por favor, ingrese su correo y su contraseña");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }
    if (!email) {
      setSnackbarMessage("Por favor, ingrese su correo electronico");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }
    if (!password) {
      setSnackbarMessage("Por favor, ingrese su contraseña");
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
      return;
    }
    setLoading(true);
    const user = {
      email: email,
      password: password,
    };
    axios
      .post("https://smarttankapi.onrender.com/login", user)
      .then((response) => {
        const token = response.data.token;
        AsyncStorage.setItem("authToken", JSON.stringify(token));
        navigation.replace("Main");
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
            "Error de inicio de sesión, ocurrió un error al iniciar sesión"
          );
        }
        setVisible(true);
        setTimeout(() => setVisible(false), 3500);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
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
              Inicie sesión en su cuenta
            </Text>
          </View>

          <View
            style={{
              marginTop: 30,
              marginBottom: 15,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
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
          </View>

          <TouchableOpacity
            onPress={() => {
              navigation.navigate("RecuperarContrasena");
            }}
            style={{
              marginTop: 12,
            }}
          >
            <Text style={{ color: "#007FFF", fontWeight: "500" }}>
              ¿Olvideaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={Iniciar}
            disabled={loading}
            style={{
              width: 200,
              backgroundColor: loading ? "#8bb5db" : "#0263b9",
              borderRadius: 10,
              marginLeft: "auto",
              marginRight: "auto",
              padding: 15,
              marginTop: 40,
              marginBottom: 20,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  color: "white",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Iniciar sesión
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("SignUp")}
            style={{ marginTop: 15 }}
          >
            <Text style={{ textAlign: "center", color: "gray", fontSize: 16 }}>
              ¿No tienes una cuenta?{" "}
              <Text style={{ color: "#007FFF", fontWeight: "500" }}>
                Registrarse
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Login;

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
});
