// src/screens/LoginScreen.js - Logo BudgetPro SVG + support thème
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

// Composant Logo BudgetPro (représentation textuelle du logo teal/vert)
function BudgetProLogo({ size = 100 }) {
  return (
    <View style={[styles.logoBox, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <LinearGradient
        colors={['#4ecdc4', '#44ea80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size * 0.22 }]}
      />
      {/* Barres de graphique */}
      <View style={styles.logoChart}>
        <View style={[styles.logoBar, { height: size * 0.22, marginRight: size * 0.03 }]} />
        <View style={[styles.logoBar, { height: size * 0.32, marginRight: size * 0.03 }]} />
        <View style={[styles.logoBar, { height: size * 0.44 }]} />
      </View>
      {/* Flèche tendance */}
      <Text style={[styles.logoArrow, { fontSize: size * 0.28 }]}>↗</Text>
      {/* Symbole $ */}
      <Text style={[styles.logoDollar, { fontSize: size * 0.22 }]}>$</Text>
    </View>
  );
}

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const { theme } = useTheme();

  const handleLogin = () => {
    if (!username.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }
    onLogin(username.trim());
  };

  return (
    <LinearGradient
      colors={theme.gradientLogin}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Logo BudgetPro */}
            <View style={styles.logoContainer}>
              <BudgetProLogo size={110} />
              <Text style={styles.logoText}>BudgetPro</Text>
            </View>

            <Text style={styles.title}>Bienvenue</Text>
            <Text style={styles.subtitle}>Gérez vos finances intelligemment</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre nom"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accent }]}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Se connecter 🚀</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              Vos données sont sauvegardées{'\n'}localement et en sécurité
            </Text>
            <Text style={styles.version}>BudgetPro v2.0</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoBox: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  logoChart: {
    position: 'absolute',
    bottom: '22%',
    left: '18%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logoBar: {
    width: '12%',
    minWidth: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 3,
  },
  logoArrow: {
    position: 'absolute',
    top: '18%',
    right: '14%',
    color: 'white',
    fontWeight: 'bold',
  },
  logoDollar: {
    position: 'absolute',
    top: '22%',
    left: '18%',
    color: 'white',
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginTop: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 44,
    textAlign: 'center',
  },
  form: { width: '100%', maxWidth: 420 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    color: '#1f2937',
  },
  button: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 18,
  },
  version: {
    position: 'absolute',
    bottom: 20,
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.6,
  },
});