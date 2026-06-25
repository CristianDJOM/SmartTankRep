import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const Notification = ({ message, visible, onClose }) => {

  useEffect(() => {
      if (visible) {
  
        const playSound = async () => {
          const { sound } = await Audio.Sound.createAsync(
            require("./assets/sonidos/notification.mp3")
          );
          await sound.playAsync();
        };
  
        playSound();
      }
    }, [visible]);
  
    if (!visible) return null;

  const cerrar = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.notificationContainer}>

          <TouchableOpacity style={styles.closeButton} onPress={cerrar}>
            <FontAwesome5 name="times" size={24} color="#BD1010" />
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: "#09a017",
              width: "2%",
              height: "70%",
              borderRadius: 15,
            }}
          ></View>

          {/* Contenido del modal */}
          <View style={styles.iconAndTextContainer}>
            <View style={{ width: "100%", height: "30%" }}>
              <Text style={{ color: "#09a017", fontSize: 18, fontWeight: "bold" }}>Excelente!</Text>
            </View>
            <View style={{ width: "100%", height: "70%" }}>
              <Text style={styles.notificationText}>{message}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default Notification;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContainer: {
    backgroundColor: "white",
    height: "14%",
    width: "85%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative", // Para posicionar el botón de cerrar
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  iconAndTextContainer: {
    marginLeft: 15,
    width: "85%",
    height: "70%",
  },
  notificationText: {
    color: "gray",
    fontSize: 15,
  },
});