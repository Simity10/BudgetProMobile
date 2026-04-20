// src/screens/LoginScreen.js - Login/Register avec email ou téléphone + mot de passe
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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';

// Composant Logo BudgetPro
function BudgetProLogo({ size = 100 }) {
  return (
    <View style={[styles.logoBox, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <LinearGradient
        colors={['#4ecdc4', '#44ea80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size * 0.22 }]}
      />
      <View style={styles.logoChart}>
        <View style={[styles.logoBar, { height: size * 0.22, marginRight: size * 0.03 }]} />
        <View style={[styles.logoBar, { height: size * 0.32, marginRight: size * 0.03 }]} />
        <View style={[styles.logoBar, { height: size * 0.44 }]} />
      </View>
      <Text style={[styles.logoArrow, { fontSize: size * 0.28 }]}>↗</Text>
      <Text style={[styles.logoDollar, { fontSize: size * 0.22 }]}>$</Text>
    </View>
  );
}

export default function LoginScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const isEmail = identifier.includes('@');
  const identifierLabel = identifier.length === 0
    ? 'Email ou Téléphone'
    : isEmail ? 'Email' : 'Téléphone';

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email ou numéro de téléphone');
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer votre nom');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }
    }

    setLoading(true);
    try {
      let userData;
      if (isRegister) {
        userData = await api.register(name.trim(), identifier.trim(), password);
      } else {
        userData = await api.login(identifier.trim(), password);
      }

      if (userData) {
        onLogin(userData.name, userData);
      } else {
        // Mode hors-ligne — fallback sur login local
        Alert.alert(
          'Mode hors-ligne',
          'Impossible de contacter le serveur. Connexion locale uniquement.',
          [{ text: 'OK' }]
        );
        if (!isRegister) {
          onLogin(identifier.trim(), null);
        }
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <BudgetProLogo size={90} />
              <Text style={styles.logoText}>BudgetPro</Text>
            </View>

            <Text style={styles.title}>
              {isRegister ? 'Créer un compte' : 'Bienvenue'}
            </Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? 'Inscrivez-vous pour sauvegarder vos données'
                : 'Connectez-vous pour retrouver vos données'}
            </Text>

            <View style={styles.form}>
              {/* Nom (inscription uniquement) */}
              {isRegister && (
                <>
                  <Text style={styles.label}>Nom complet</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </>
              )}

              {/* Email ou Téléphone */}
              <Text style={styles.label}>{identifierLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder="email@exemple.com ou 77 123 45 67"
                placeholderTextColor="#9ca3af"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType={isEmail ? 'email-address' : 'default'}
              />

              {/* Mot de passe */}
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="6 caractères minimum"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Confirmer mot de passe (inscription) */}
              {isRegister && (
                <>
                  <Text style={styles.label}>Confirmer le mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Retapez le mot de passe"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </>
              )}

              {/* Bouton principal */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accent }, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isRegister ? "S'inscrire" : 'Se connecter'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Switch login/register */}
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setIsRegister(!isRegister);
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.switchText}>
                  {isRegister
                    ? 'Déjà un compte ? Se connecter'
                    : "Pas de compte ? S'inscrire"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              Vos données sont sauvegardées{'\n'}dans le cloud en toute sécurité
            </Text>
            <Text style={styles.version}>BudgetPro v2.1</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 30,
    textAlign: 'center',
  },
  form: { width: '100%', maxWidth: 420 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    marginBottom: 16,
    color: '#1f2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeText: {
    fontSize: 20,
  },
  button: {
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  switchButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#ffffff',
    textDecorationLine: 'underline',
    opacity: 0.9,
  },
  footer: {
    marginTop: 30,
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 18,
  },
  version: {
    marginTop: 12,
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.6,
  },
});
