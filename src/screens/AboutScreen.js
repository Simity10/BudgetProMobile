// src/screens/AboutScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

export default function AboutScreen() {
  const { theme } = useTheme();

  const features = [
    {
      icon: '💰',
      title: 'Suivez vos revenus',
      text: 'Enregistrez toutes vos sources de revenus : salaire, freelance, commerce et plus encore.',
    },
    {
      icon: '💸',
      title: 'Contrôlez vos dépenses',
      text: 'Catégorisez chaque dépense pour savoir exactement où va votre argent chaque mois.',
    },
    {
      icon: '📊',
      title: 'Analysez votre budget',
      text: 'Visualisez votre solde, taux d\'épargne et vue d\'ensemble en temps réel.',
    },
    {
      icon: '🔮',
      title: 'Prédictions IA',
      text: 'Notre intelligence artificielle analyse vos habitudes et prédit vos dépenses futures pour mieux planifier.',
    },
    {
      icon: '🎯',
      title: 'Atteignez vos objectifs',
      text: 'Fixez-vous des objectifs d\'épargne et suivez votre progression mois après mois.',
    },
    {
      icon: '🔒',
      title: 'Données sécurisées',
      text: 'Toutes vos données sont stockées localement sur votre téléphone. Personne d\'autre n\'y a accès.',
    },
  ];

  const faqs = [
    {
      q: 'Mes données sont-elles en sécurité ?',
      a: 'Oui, toutes vos données sont stockées uniquement sur votre téléphone via AsyncStorage. Aucune donnée n\'est envoyée sur internet.',
    },
    {
      q: 'Comment fonctionne la limite de 50 transactions ?',
      a: 'La version gratuite permet 50 transactions par mois (revenus + dépenses combinés). Passez à Premium pour des transactions illimitées.',
    },
    {
      q: 'Puis-je utiliser l\'app sans connexion internet ?',
      a: 'Oui ! BudgetPro fonctionne entièrement hors ligne. Aucune connexion internet n\'est nécessaire.',
    },
    {
      q: 'Comment changer le thème de l\'application ?',
      a: 'Allez dans l\'onglet "Plus" → section "Thème de l\'application" et choisissez parmi 4 thèmes disponibles.',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

        {/* Header */}
        <LinearGradient colors={theme.gradientHeader} style={styles.header}>
          <Text style={styles.headerEmoji}>❓</Text>
          <Text style={styles.headerTitle}>Aide & À propos</Text>
          <Text style={styles.headerSubtitle}>BudgetPro v2.0</Text>
        </LinearGradient>

        {/* Présentation */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🌟 Qu'est-ce que BudgetPro ?</Text>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            BudgetPro est votre assistant financier personnel conçu pour les utilisateurs africains.
            Gérez vos revenus et dépenses en FCFA, analysez vos habitudes et prenez le contrôle
            de votre argent facilement depuis votre téléphone.
          </Text>
        </View>

        {/* Fonctionnalités */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>✨ Fonctionnalités</Text>
          {features.map((f, i) => (
            <View key={i} style={[styles.featureCard, { backgroundColor: theme.cardBg }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{f.title}</Text>
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{f.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>❓ Questions fréquentes</Text>
          {faqs.map((faq, i) => (
            <View key={i} style={[styles.faqCard, { backgroundColor: theme.cardBg, borderLeftColor: theme.accent }]}>
              <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>Q : {faq.q}</Text>
              <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>R : {faq.a}</Text>
            </View>
          ))}
        </View>

        {/* Comment utiliser */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📖 Comment commencer ?</Text>
          <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
            {[
              'Connectez-vous avec votre nom d\'utilisateur',
              'Ajoutez vos revenus dans l\'onglet 💰 Revenus',
              'Enregistrez vos dépenses dans l\'onglet 💸 Dépenses',
              'Consultez votre tableau de bord dans 📊 Accueil',
              'Analysez vos prédictions dans 🔮 IA',
              'Personnalisez l\'app dans ⚙️ Plus',
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.textPrimary }]}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Version */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>BudgetPro v2.0</Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>© 2024 Tous droits réservés</Text>
          <Text style={[styles.footerSub, { color: theme.textSecondary }]}>
            Fait avec ❤️ pour la communauté africaine
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 30, alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerEmoji: { fontSize: 48, marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.85 },
  section: { padding: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: {
    marginHorizontal: 20, marginTop: 16,
    padding: 18, borderRadius: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  cardText: { fontSize: 14, lineHeight: 22 },
  featureCard: {
    flexDirection: 'row', padding: 14, borderRadius: 14,
    marginBottom: 10, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  featureIcon: { fontSize: 28, marginRight: 14, marginTop: 2 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  featureText: { fontSize: 13, lineHeight: 19 },
  faqCard: {
    padding: 16, borderRadius: 14, marginBottom: 10,
    borderLeftWidth: 4, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  faqQuestion: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  faqAnswer: { fontSize: 13, lineHeight: 20 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  stepNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
  footer: { padding: 24, alignItems: 'center' },
  footerText: { fontSize: 13, marginBottom: 3 },
  footerSub: { fontSize: 12, marginTop: 6 },
});