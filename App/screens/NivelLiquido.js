import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

const NivelLiquido = () => {
  const route = useRoute();
  const { dispositivoId } = route.params;
  const [alturaTanque, setalturaTanque] = useState("");
  const [nivel, setNivel] = useState(null);
  const [porcentajeNivel, setporcentajeNivel] = useState("");
  const [ConsumoHistoricos, setConsumoHistoricos] = useState([]);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

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
            Detalles del nivel
          </Text>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  //consultar nivel 
  useEffect(() => {
    const fetchNivel = async () => {
      try {
        const res = await fetch(
          `https://smarttankapi.onrender.com/Detalles/nivel/${dispositivoId}`
        );
        const data = await res.json();
        setNivel(data.nivel);
        setporcentajeNivel(data.porcentaje)
        setalturaTanque(data.dispositivos[0].HeightTank);
        setConsumoHistoricos(data.consumoUltimos5Meses);
        setError(null);
      } catch (error) {
        console.error("Error al obtener nivel:", error);
        setError("Error al obtener nivel.");
      }
    };

    fetchNivel();
    const interval = setInterval(fetchNivel, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: porcentajeNivel,
      duration: 800,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [nivel]);

  const alturaMetros = nivel / 100;
  //const porcentajeNivel = (nivel / alturaTanque) * 100;

  const estado = () => {
    if (porcentajeNivel <= 25) return "Bajo";
    if (porcentajeNivel <= 50) return "Medio";
    if (porcentajeNivel <= 75) return "Normal";
    return "Lleno";
  };

  const alturaAnimada = animatedHeight.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  if (nivel === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BFFF" />
        <Text>Cargando nivel...</Text>
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
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: "rgb(242, 247, 250)", flex: 1 }}>
        <View
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            Nivel Actual
          </Text>
        </View>

        <View style={styles.container}>
          <View></View>
          <View style={styles.info}>
            <Text style={styles.label}>Porcentaje del nivel</Text>
            <Text style={styles.valor}>{porcentajeNivel.toFixed(0)}%</Text>

            <Text style={styles.label}>Profundidad del nivel</Text>
            <Text style={styles.valor}>{nivel.toFixed(2)} L</Text>

            <Text style={styles.label}>Estado del nivel</Text>
            <Text style={styles.valor}>{estado()}</Text>
          </View>

          <View style={styles.tanque}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  bottom: `${i * 20}%`,
                  width: "50%",
                  height: 2.5,
                  backgroundColor: "#ccc",
                }}
              />
            ))}

            <Animated.View
              style={[styles.nivelAgua, { height: alturaAnimada }]}
            >
              <LinearGradient
                colors={["#a6e1fa", "#00abe5"]}
                style={{ flex: 1, width: "100%" }}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            </Animated.View>

            <Text style={styles.textoNivel}>{porcentajeNivel.toFixed(0)}%</Text>
          </View>
        </View>
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 10,
              margin: "auto",
            }}
          >
            Historial de Consumo
          </Text>
          {ConsumoHistoricos.length > 0 && (
            <LineChart
              data={{
                labels: ConsumoHistoricos.map((item) =>
                  new Date(item.mes).toLocaleDateString()
                ),
                datasets: [
                  {
                    data: ConsumoHistoricos.map((item) => item.consumo),
                  },
                ],
              }}
              width={Dimensions.get("window").width - 40}
              height={220}
              yAxisSuffix="L"
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: "#e0f7fa",
                backgroundGradientFrom: "#a6e1fa",
                backgroundGradientTo: "#00abe5",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#00abe5",
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 20,
  },
  info: {
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    color: "gray",
  },
  valor: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 35,
  },
  tanque: {
    width: 150,
    height: 300,
    backgroundColor: "white",
    borderWidth: 2.5,
    borderColor: "#616161",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
  },
  nivelAgua: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    overflow: "hidden",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  textoNivel: {
    position: "absolute",
    bottom: 10,
    color: "black",
    fontWeight: "bold",
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});

export default NivelLiquido;
