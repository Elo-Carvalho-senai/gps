import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, ActivityIndicator, 
  Alert, Platform, TouchableOpacity 
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

// COORDENADAS DO PONTO DE ENCONTRO
const PONTO_ENCONTRO_PET = {
  latitude: -21.800481, // Substitua pela latitude do ponto de encontro
  longitude: -50.884091, // Substitua pela longitude do ponto de encontro
};

export default function LocalizaPet() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [distancia, setDistancia] = useState<number | null>(null);
  const [chegou, setChegou] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    (async () => {
      //1. Solicitar permissão para acessar a localização
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos do GPS para localizar o pet!.');
        return;
      }

      //2. Monitorar a localização do usuário em tempo real
      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1, // Atualiza a cada 1 metro
          timeInterval: 1000, // Atualiza a cada 1 segundo
        },
        (newLocation) => {
          setLocation(newLocation);

          // 3. Calcular a distância usando geolib
          const d = getDistance(
            { latitude: newLocation.coords.latitude, longitude: newLocation.coords.longitude },
            PONTO_ENCONTRO_PET
          );
          setDistancia(d);

          // 4. Verificar se o usuário chegou (8 metros)
          if (d <= 8 && !chegou) setChegou(true);
        }
      );
    })();
  }, [chegou]);


  const getStatusMessage = () => {
    if (!distancia) return "Rastreando sinal...";
    if (distancia <= 10) return "O PET ESTÁ AQUI! 🐶";
    if (distancia < 30) return "O PET ESTÁ PERTO! 🐕";
    if (distancia < 100) return "SINAL FICANDO FORTE...☀️";
    return "PET AINDA DISTANTE...❄️"
  };

  if (!location) {
     return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Sincronizando GPS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* HEADER DO APP */}
      <View style={styles.brandHeader}>
        <View style={styles.logoCircle}>
          <Ionicons name="paw" size={32} color="#3498db" />
        </View>
        <View>
          <Text style={styles.brandName}>LOCALIZA</Text>
          <Text style={styles.appName}>Pet Tracker</Text>
        </View>
      </View>

      {/* JANELA DO MAPA ARREDONDADA */}
      <View style={styles.mapContainer}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {/* Cerca Virtual do Pet */}
          <Circle
            center={PONTO_ENCONTRO_PET}
            radius={15}
            fillColor="rgba(52, 152, 219, 0.2)"
            strokeColor="#3498db"
            strokeWidth={2}
          />
          <Marker coordinate={PONTO_ENCONTRO_PET} title="Ponto de Encontro">
            <Ionicons name="location" size={35} color="#e74c3c" />
          </Marker>
        </MapView>
      </View>

      {/* HUD DE STATUS */}
      <View style={styles.hud}>
        <Text style={styles.statusLabel}>{getStatusMessage()}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distancia}m</Text>
            <Text style={styles.statLabel}>Distância</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Ionicons
              name={distancia && distancia < 50 ? "flash" : "wifi-outline"}
              size={32}
              color={distancia && distancia < 50 ? "#f1c40f" : "#bdc3c7"}
            />
            <Text style={styles.statLabel}>Sinal</Text>
          </View>
        </View>

        {chegou && (
          <TouchableOpacity
            style={styles.winButton}
            onPress={() => Alert.alert("Sucesso!", "Você encontrou o pet!")}
          >
            <Text style={styles.winButtonText}>CONFIRMAR RESGATE 🎉</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#3498db', fontWeight: 'bold' },

  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 15,
    elevation: 4,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF5FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  brandName: { color: '#3498db', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  appName: { color: '#2C3E50', fontSize: 24, fontWeight: '900' },

  mapContainer: {
    height: '55%',
    width: '92%',
    alignSelf: 'center',
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFF',
    elevation: 8,
  },
  map: { width: '100%', height: '100%' },

  hud: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: { color: '#2C3E50', fontSize: 18, fontWeight: '800', marginBottom: 15 },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 25,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 2,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#3498db', fontSize: 32, fontWeight: 'bold' },
  statLabel: { color: '#95A5A6', fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  divider: { width: 1, height: 40, backgroundColor: '#ECF0F1' },

  winButton: {
    backgroundColor: '#2ecc71',
    width: '100%',
    padding: 18,
    borderRadius: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  winButtonText: { color: '#FFF', fontWeight: '900', fontSize: 18 },
});