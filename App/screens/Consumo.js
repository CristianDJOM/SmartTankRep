import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useEffect, useContext, useState } from "react";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import NetInfo from "@react-native-community/netinfo";
import { LineChart } from "react-native-chart-kit";
import moment from "moment";
import "moment/locale/es";
import { Feather } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Entypo from "@expo/vector-icons/Entypo";

const { width, height } = Dimensions.get("window");

const Consumo = () => {
  const route = useRoute();
  const { userId } = route.params;
  const [filtro, setFiltro] = useState("Hoy");

  const [consumo, setconsumo] = useState();
  const [ConsumoHistoricos, setConsumoHistoricos] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [showStepsDias, setShowStepsDias] = useState(false);
  const [showStepsSemana, setShowStepsSemana] = useState(false);
  const [showStepsMes, setShowStepsMes] = useState(false);

  const mesActual = moment().format("MMMM");
  const mesAnterior = moment().subtract(1, "month").format("MMMM");

  const mesesDisponibles = [mesActual, mesAnterior];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const navigation = useNavigation();
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "black",
              marginTop: 5,
              marginBottom: 5,
            }}
          >
            Detalles de consumo
          </Text>
          <View
            style={{
              width: "22%",
              height: "100%",
              flexDirection: "row",
              marginLeft: "28%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={styles.botonFiltro}
              onPress={() => setModalVisible(true)}
            >
              <FontAwesome5 name="filter" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      ),
    });
  }, [navigation]);
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://smarttankapi.onrender.com/consumo/todos/${userId}`
      );
      setconsumo(response.data.dispositivos);
      setConsumoHistoricos(response.data.consumoUltimos5Meses);
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

  const seleccionarFiltro = (tipo) => {
    setFiltro(tipo);
    setModalVisible(false);
    setShowStepsDias(false);
    setShowStepsSemana(false);
    setShowStepsMes(false);
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
  const titulosFiltro = {
    Hoy: "Detalles de pagos del día de hoy",
    Ayer: "Detalles de pagos del día de ayer",
    "Esta semana": "Detalles de pagos de esta semana",
    "Semana pasada": "Detalles de pagos de la semana pasada",
    "Este mes": `Detalles de pagos de este mes`,
    "Mes pasado": `Detalles de pagos del mes pasado`,
  };

  let totalLitros = 0;
  let totalCosto = 0;

  if (consumo && Array.isArray(consumo)) {
    consumo.forEach((item) => {
      switch (filtro) {
        case "Hoy":
          totalLitros += item.hoy || 0;
          totalCosto += item.Choy || 0;
          break;
        case "Ayer":
          totalLitros += item.ayer || 0;
          totalCosto += item.Cayer || 0;
          break;
        case "Esta semana":
          totalLitros += item.semana || 0;
          totalCosto += item.Csemana || 0;
          break;
        case "Semana pasada":
          totalLitros += item.semanaPasada || 0;
          totalCosto += item.CsemanaPasada || 0;
          break;
        case "Este mes":
          totalLitros += item.mes || 0;
          totalCosto += item.Cmes || 0;
          break;
        case "Mes pasado":
          totalLitros += item.mesPasado || 0;
          totalCosto += item.CmesPasado || 0;
          break;
      }
    });
  }

  return (
    <View style={styles.container}>
      <View
        style={{
          backgroundColor: "#46a7fd",
          width: "100%",
          marginTop: 5,
          alignItems: "center",
          borderRadius: 12,
          marginBottom: 20,
          padding: 8,
        }}
      >
        {titulosFiltro[filtro] && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: "white",
              marginVertical: 5,
            }}
          >
            {titulosFiltro[filtro]}
          </Text>
        )}
      </View>
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Dispositivo</Text>
        <Text style={styles.headerText}>Consumo</Text>
        <Text style={styles.headerText}>Valor</Text>
      </View>
      <View style={{ width: "100%", maxHeight: "68%", minHeight: 40 }}>
        <FlatList
          data={consumo}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.cell}>{item.deviceName}</Text>
              {filtro === "Hoy" && (
                <>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.hoy)}{" "}
                    L
                  </Text>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.Choy)}{" "}
                    $
                  </Text>
                </>
              )}
              {filtro === "Ayer" && (
                <>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.ayer)}{" "}
                    L
                  </Text>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.Cayer)}{" "}
                    $
                  </Text>
                </>
              )}
              {filtro === "Esta semana" && (
                <>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.semana)}{" "}
                    L
                  </Text>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.Csemana)}{" "}
                    $
                  </Text>
                </>
              )}
              {filtro === "Semana pasada" && (
                <>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.semanaPasada)}{" "}
                    L
                  </Text>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.CsemanaPasada)}{" "}
                    $
                  </Text>
                </>
              )}
              {filtro === "Este mes" && (
                <>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.mes)}{" "}
                    L
                  </Text>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.Cmes)}{" "}
                    $
                  </Text>
                </>
              )}
              {filtro === "Mes pasado" && (
                <>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.mesPasado)}{" "}
                    L
                  </Text>
                  <Text style={styles.cell}>
                    {new Intl.NumberFormat("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.CmesPasado)}{" "}
                    $
                  </Text>
                </>
              )}
            </View>
          )}
        />
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>{`Total ${filtro}:`}</Text>

        <Text style={styles.totalText}>
          {new Intl.NumberFormat("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalCosto)}{" "}
          $
        </Text>
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
          Historial Total de Consumo
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

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecciona un Filtro</Text>

                <TouchableOpacity
                  style={styles.opcion}
                  onPress={() => setShowStepsDias(!showStepsDias)}
                >
                  <Text style={styles.opcionTexto}>Días</Text>
                  <Entypo
                    name={showStepsDias ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="gray"
                  />
                </TouchableOpacity>

                {showStepsDias && (
                  <>
                    <TouchableOpacity
                      style={styles.opcion2}
                      onPress={() => {
                        seleccionarFiltro("Hoy");
                      }}
                    >
                      <Text style={styles.opcionTexto}>Hoy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.opcion2}
                      onPress={() => {
                        seleccionarFiltro("Ayer");
                      }}
                    >
                      <Text style={styles.opcionTexto}>Ayer</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.opcion}
                  onPress={() => setShowStepsSemana(!showStepsSemana)}
                >
                  <Text style={styles.opcionTexto}>Semanas</Text>
                  <Entypo
                    name={showStepsSemana ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="gray"
                  />
                </TouchableOpacity>

                {showStepsSemana && (
                  <>
                    <TouchableOpacity
                      style={styles.opcion2}
                      onPress={() => {
                        seleccionarFiltro("Esta semana");
                      }}
                    >
                      <Text style={styles.opcionTexto}>Esta semana</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.opcion2}
                      onPress={() => {
                        seleccionarFiltro("Semana pasada");
                      }}
                    >
                      <Text style={styles.opcionTexto}>Semana pasada</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.opcion}
                  onPress={() => setShowStepsMes(!showStepsMes)}
                >
                  <Text style={styles.opcionTexto}>Meses</Text>
                  <Entypo
                    name={showStepsMes ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="gray"
                  />
                </TouchableOpacity>

                {showStepsMes && (
                  <>
                    <TouchableOpacity
                      style={styles.opcion2}
                      onPress={() => {
                        seleccionarFiltro("Este mes");
                      }}
                    >
                      <Text style={styles.opcionTexto}>Este mes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.opcion2}
                      onPress={() => {
                        seleccionarFiltro("Mes pasado");
                      }}
                    >
                      <Text style={styles.opcionTexto}>Mes pasado</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.cerrarBoton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cerrarTexto}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Consumo;

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: "rgb(242, 247, 250)",
    padding: 10,
  },
  link: {
    color: "#af9900",
    fontSize: 15,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(242, 247, 250)",
  },
  botonPDF: {
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgb(242, 247, 250)",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  botonFiltro: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  opcion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 5,
  },
  opcion2: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#e8e8e8",
    borderRadius: 6,
    marginVertical: 3,
  },
  opcionTexto: {
    fontSize: 16,
    color: "#444",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  cerrarBoton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  cerrarTexto: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    width: "100%",
    paddingBottom: 5,
    paddingTop: 5,
    borderRadius: 5,
    marginBottom: 2,
  },
  headerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 8,
    marginBottom: 2,
    borderRadius: 5,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 5,
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    pwidth: "100%",
    paddingBottom: 8,
    paddingTop: 8,
    marginTop: 0,
    borderRadius: 5,
  },
  totalText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "white",
    width: "95%",
    height: 50,
    borderRadius: 10,
    elevation: 5,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
});
