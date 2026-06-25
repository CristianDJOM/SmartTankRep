import React, { useEffect, useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import NetInfo from "@react-native-community/netinfo";
import { UserType } from "../UserContext";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import IconoTanque from "../assets/IconoTanque.png";
import logo from "../assets/Logo.png";

const { width, height } = Dimensions.get("window");

const Home = () => {
  const { userId, setUserId } = useContext(UserType);
  const navigation = useNavigation();
  const [dispositivos, setDispositivos] = useState([]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const parsedToken = JSON.parse(token);
          setUserId(parsedToken.userId);
        } else {
          console.error("No token found");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`https://smarttankapi.onrender.com/Dispositivos/${userId}`);
      const data = await res.json();
      setDispositivos(data);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener los dispositivos:", error);
      setError("Error al cargar los dispositivos.");
    }
  };

  useEffect(() => {
    if (isConnected && userId) {
      fetchUserProfile();
    }
  }, [isConnected, userId]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    fetchUserProfile();
    setIsRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

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

  const eliminarDispositivo = async (id) => {
    Alert.alert("Eliminar", "¿Deseas eliminar este dispositivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        onPress: async () => {
          await axios
            .post(`https://smarttankapi.onrender.com/Eliminar/${id}`)
            .then((response) => {
              if (response.status === 200 && response.data.message) {
                setSnackbarMessageN("dispositivo eliminado correctamente");
                fetchUserProfile();
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
            })
            .catch((error) => {
              if (
                error.response &&
                error.response.data &&
                error.response.data.message
              ) {
                setSnackbarMessage(error.response.data.message);
              } else {
                setSnackbarMessage("Error al eliminar el dispositivo");
              }
              setTimeout(() => setVisible(false), 5000);
            });
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: "rgb(242, 247, 250)", flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View
          style={{
            marginBottom: 90,
            backgroundColor: "rgb(242, 247, 250)",
            flex: 1,
          }}
        >
          <View
            style={{
              width: "100%",
              height: 230,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                width: "95%",
                height: "100%",
                borderRadius: 10,
                elevation: 5,
              }}
            >
              <Text
                style={{ margin: "auto", fontWeight: "bold", fontSize: 15 }}
              >
                Api Clima
              </Text>
            </View>
          </View>
          <Text style={{ fontWeight: "bold", fontSize: 16, margin: 15 }}>
            Todos Los Dispositivos:
          </Text>

          {dispositivos.length === 0 ? (
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No hay dispositivos guardados.
            </Text>
          ) : (
            dispositivos.map((item, index) => (
              <View key={index} style={styles.Tarjetas}>
                <TouchableOpacity
                  style={{ flexDirection: "row", flex: 1 }}
                  onPress={() =>
                    navigation.navigate("NivelLiquido", {
                      dispositivoId: item.idDispositivo,
                    })
                  }
                >
                  <View
                    style={{
                      width: "20%",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Image
                      source={IconoTanque}
                      style={{
                        width: "100%",
                        height: 50,
                        resizeMode: "contain",
                      }}
                    />
                  </View>
                  <View
                    style={{
                      width: "70%",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                      {item.deviceName}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: "10%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedDevice(item);
                        setMenuVisible(true);
                      }}
                    >
                      <MaterialIcons name="more-vert" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("NuevoEquipo")}
          >
            <Text style={styles.optionText}>Agregar</Text>
            <MaterialIcons
              name="add"
              size={28}
              color="white"
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
      {menuVisible && selectedDevice && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setMenuVisible(false)}
            activeOpacity={1}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("EditarDispositivo", {
                    dispositivoId: selectedDevice.idDispositivo,
                  });
                }}
              >
                <Text style={styles.menuItem}>Editar Dispositivo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  eliminarDispositivo(selectedDevice.idDispositivo);
                }}
              >
                <Text style={[styles.menuItem, { color: "red" }]}>
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  headerLogo: {
    width: width * 0.2,
    height: height * 0.08,
  },
  Tarjetas: {
    flexDirection: "row",
    marginTop: 5,
    marginBottom: 5,
    width: width * 0.95,
    height: height * 0.1,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
    marginHorizontal: "auto",
    alignItems: "center",
    position: "relative",
  },
  deleteBtn: {
    position: "absolute",
    right: 5,
    backgroundColor: "red",
    padding: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    width: "40%",
    height: 60,
    backgroundColor: "#0263b9",
    borderRadius: 15,
    justifyContent: "center",
    margin: "auto",
    marginTop: 20,
  },
  optionText: {
    color: "white",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: 200,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  menuItem: {
    padding: 10,
    fontSize: 16,
    textAlign: "center",
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
});
