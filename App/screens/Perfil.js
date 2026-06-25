import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useEffect, useContext, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import NetInfo from "@react-native-community/netinfo";
import { UserType } from "../UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import logo from "../assets/Logo.png";

const { width, height } = Dimensions.get("window");

const Perfil = () => {
  const { userId, setUserId } = useContext(UserType);
  const navigation = useNavigation();
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <Image source={logo} style={styles.headerLogo} />
        </View>
      ),

      headerStyle: {
        backgroundColor: "#FFFFFF",
      },
    });
  }, [navigation]);

  const [user, setUser] = useState();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://smarttankapi.onrender.com/profile/${userId}`
      );
      const { user } = response.data;
      setUser(user);
      setError(null);
    } catch (error) {
      setError("Error al cargar los datos.");
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && userId) {
      fetchUserProfile();
    }
  }, [isConnected, userId]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserProfile();
    setIsRefreshing(false);
  };

  const logout = () => {
    clearAuthToken();
  };

  const clearAuthToken = async () => {
    await AsyncStorage.removeItem("authToken");
    console.log("auth token cleared");
    navigation.replace("Login");
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.noInternetContainer}>
        <Feather name="wifi-off" size={50} color="black" />
        <Text style={styles.noInternetText}>No tienes conexión a Internet</Text>
        <Text style={styles.noInternetSubText}>
          Verifica tu conexión e inténtalo de nuevo.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
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
    <View style={{ flex: 1, marginBottom: 70 }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.profilePictureContainer}
            onPress={() => {
              navigation.navigate("EditarEmpleado");
            }}
          >
            <FontAwesome5
              style={{ marginLeft: 8 }}
              name="user-edit"
              size={28}
              color="#6F2C6F"
            />
          </TouchableOpacity>
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor: "#46a7fd",
              marginBottom: 10,
            }}
          >
            <Text style={styles.profileName}>{user?.name}</Text>
          </View>

          <View
            style={{
              width: "90%",
              borderBottomWidth: 2,
              borderBottomColor: "#46a7fd",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ width: "10%" }}>
              <MaterialIcons
                name="email"
                size={24}
                color="#0263b9"
                style={{ marginLeft: 5 }}
              />
            </View>
            <View style={{ width: "90%", marginLeft: 18 }}>
              <Text
                style={{ color: "black", fontSize: 15, fontWeight: "bold" }}
              >
                Correo
              </Text>
              <Text style={styles.profileDetails}>{user?.email}</Text>
            </View>
          </View>
          <View
            style={{
              width: "90%",
              borderBottomWidth: 2,
              borderBottomColor: "#46a7fd",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ width: "10%" }}>
              <FontAwesome
                name="mobile-phone"
                size={30}
                color="#0263b9"
                style={{ marginLeft: 10 }}
              />
            </View>
            <View style={{ width: "90%", marginLeft: 18 }}>
              <Text
                style={{ color: "black", fontSize: 15, fontWeight: "bold" }}
              >
                Número
              </Text>
              <Text style={styles.profileDetails}>{user?.phone}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            navigation.navigate("Consumo", {
              userId: userId,
            });
          }}
        >
          <FontAwesome5 name="chart-bar" size={24} color="white" />
          <Text style={styles.optionText}>Mi Consumo</Text>
          <FontAwesome5
            name="chevron-right"
            size={24}
            color="white"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            navigation.navigate("RendimientoEmpleado", {
              clienteId: userId,
            });
          }}
        >
          <MaterialIcons name="settings" size={24} color="white" />
          <Text style={styles.optionText}>Ajustes</Text>
          <FontAwesome5
            name="chevron-right"
            size={24}
            color="white"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} style={styles.option}>
          <AntDesign name="logout" size={24} color="white" />
          <Text style={styles.logoutText}>Salir</Text>
          <FontAwesome5
            name="chevron-right"
            size={24}
            color="white"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Perfil;

const styles = StyleSheet.create({
  headerLogo: {
    width: width * 0.4,
    height: height * 0.07,
    marginRight: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "rgb(242, 247, 250)",
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: "#E6E8EB",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    position: "relative",
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  profilePictureContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    elevation: 5,
  },
  profileName: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 5,
  },
  profileDetails: {
    color: "gray",
    fontSize: 13,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#0263b9",
    borderRadius: 5,
    marginBottom: 10,
  },
  optionText: {
    color: "white",
    fontSize: 16,
    marginLeft: 15,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    marginLeft: 15,
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
  noInternetContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(242, 247, 250)",
  },
  noInternetText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  noInternetSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginHorizontal: 20,
    marginTop: 5,
  },
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
  headerLogo: {
    width: width * 0.2,
    height: height * 0.08,
  },
});
