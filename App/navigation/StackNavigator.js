import React, {useState, useEffect, useContext} from "react";
import { Text } from "react-native";
import { StyleSheet, View, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import LottieView from "lottie-react-native";
import logo from "../assets/Logo.png";

import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import Home from "../screens/Home";
import Perfil from "../screens/Perfil";
import NivelLiquido from "../screens/NivelLiquido";
import NuevoEquipo from "../screens/NuevoEquipo";
import Login from "../screens/Login";
import SignUp from "../screens/SignUp";
import EditarDispositivo from "../screens/EditarDispositivo";
import Consumo from "../screens/Consumo";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ onPress, focused }) => (
  <TouchableOpacity
    style={{
      top: -10,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 3.5,
      elevation: 5,
    }}
    onPress={onPress}
  >
    <View
      style={{
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#e32f45",
      }}
    />
  </TouchableOpacity>
);

const TabBarIconWithLabel = ({ focused, icon, label }) => (
  <View
    style={{
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: focused ? "rgba(0, 127, 255, 0.15)" : "transparent",
      borderRadius: 15,
      paddingVertical: 5,
      paddingHorizontal: 10,
      minWidth: 100,
      height: 60,
      marginTop: 30,
    }}
  >
    {icon}
    <Text
      style={{
        color: focused ? "#0263b9" : "#808080",
        fontSize: 12,
        fontWeight: "bold",
        marginTop: 3,
      }}
    >
      {label}
    </Text>
  </View>
);

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "white",
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          marginBottom: 5,
        },
        tabBarActiveTintColor: "#14421f",
        tabBarInactiveTintColor: "#808080",
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIconWithLabel
              focused={focused}
              icon={
                focused ? (
                  <Ionicons name="home-sharp" size={24} color="#0263b9" />
                ) : (
                  <Ionicons name="home-outline" size={24} color="#808080" />
                )
              }
              label="Home"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={Perfil}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIconWithLabel
              focused={focused}
              icon={
                focused ? (
                  <MaterialIcons name="person" size={24} color="#0263b9" />
                ) : (
                  <MaterialIcons
                    name="person-outline"
                    size={24}
                    color="#808080"
                  />
                )
              }
              label="Perfil"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const StackNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Iniciando aplicación...");
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setStatusMessage("Conectando al servidor...");
        const response = await axios.post(
          "https://smarttankapi.onrender.com/api/conexion",
          { clave: "valor" }
        );

        if (response.status === 200) {
          console.log("Conectado al servidor");
          setStatusMessage("Servidor conectado con éxito.");

          setStatusMessage("Revisando sesión guardada...");
          const token = await AsyncStorage.getItem("authToken");

          if (token) {
            setStatusMessage("Sesión encontrada. Buscando Credenciales");
            const session = JSON.parse(token);

            // Verificar si el userId existe antes de hacer la solicitud
            if (session.userId) {
              try {
                const response = await axios.get(
                  `https://smarttankapi.onrender.com/profile/${session.userId}`
                );
                const { user } = response.data;

                if (user) {
                  console.log(
                    "Credenciales encontradas. Cargando aplicación..."
                  );
                  setIsLoggedIn(true);
                } else {
                  console.warn("Usuario inactivo o no encontrado.");
                  await AsyncStorage.removeItem("authToken");
                  setStatusMessage("Usuario inactivo. Redirigiendo a login...");
                }
              } catch (error) {
                console.error("Error al obtener el perfil del usuario:", error);
                await clearAuthToken();
                setStatusMessage(
                  "Error al verificar credenciales. Redirigiendo a login..."
                );
              }
            } else {
              console.warn("userId no encontrado.");
              await AsyncStorage.removeItem("authToken");
              setStatusMessage(
                "ID de usuario no válido. Redirigiendo a login..."
              );
            }
          } else {
            setStatusMessage("No se encontró sesión. Redirigiendo a login...");
          }

          setIsLoading(false);
        } else {
          console.error("Error en la respuesta del servidor:", response.status);
          retryConnection();
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        retryConnection();
      }
    };

    const retryConnection = () => {
      setStatusMessage("Error de conexión. Reintentando...");
      setTimeout(checkConnection, 3000);
    };

    checkConnection();
  }, []);

  const clearAuthToken = async () => {
    await AsyncStorage.removeItem("authToken");
    console.log("auth token cleared");
    navigation.replace("Login");
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Image source={logo} style={styles.logo} />
        <LottieView
          source={require("../assets/Animation.json")}
          autoPlay
          loop
          style={styles.animation}
        />
        <Text style={styles.statusText}>{statusMessage}</Text>
      </View>
    );
  }
  try {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName={isLoggedIn ? "Main" : "Login"}>
          <Stack.Screen
            name="Main"
            component={BottomTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUp}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NivelLiquido"
            component={NivelLiquido}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="EditarDispositivo"
            component={EditarDispositivo}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="NuevoEquipo"
            component={NuevoEquipo}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Consumo"
            component={Consumo}
            options={{ headerShown: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    console.error("Error en la navegación:", error);
    return (
      <Text style={{ color: "red", fontSize: 20 }}>
        Ocurrió un error en la navegación
      </Text>
    );
  }
};

export default StackNavigator;

const styles = StyleSheet.create({
  animation: {
    width: "60%",
    height: "20%",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "85%",
    height: 300,
    resizeMode: "contain",
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: "black",
    textAlign: "center",
    paddingHorizontal: 20,
    fontWeight: "bold",
  },
});
