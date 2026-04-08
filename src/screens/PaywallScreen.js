// src/screens/PaywallScreen.js - Avec support thème
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumManager from '../utils/PremiumManager';
import { useTheme } from '../theme/ThemeContext';

export default function PaywallScreen({ navigation, onSuccess }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      await PremiumManager.getProducts();
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (sku) => {
    setPurchasing(true);
    try {
      const success = await PremiumManager.purchaseSubscription(sku);
      if (success) {
        Alert.alert(
          'Félicitations ! 🎉',
          'Vous êtes maintenant Premium !',
          [{
            text: 'Commencer',
            onPress: () => {
              if (onSuccess) onSuccess();
              navigation.goBack();
            },
          }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter le paiement');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const restored = await PremiumManager.restorePurchases();
    setLoading(false);
    if (restored) {
      Alert.alert('Succès', 'Abonnement restauré !');
      if (onSuccess) onSuccess();
      navigation.goBack();
    } else {
      Alert.alert('Info', 'Aucun abonnement trouvé');
    }
  };

  const features = [
    { icon: '✨', title: 'Transactions illimitées', subtitle: 'Ajoutez autant que vous voulez' },
    { icon: '📊', title: 'Prédictions IA avancées', subtitle: 'Anticipez vos finances' },
    { icon: '📄', title: 'Export PDF', subtitle: 'Rapports professionnels' },
    { icon: '☁️', title: 'Sync Cloud', subtitle: 'Multi-appareils' },
    { icon: '🎯', title: 'Objectifs multiples', subtitle: 'Planifiez vos projets' },
    { icon: '🚫', title: 'Sans publicité', subtitle: 'Expérience pure' },
    { icon: '⚡', title: 'Support prioritaire', subtitle: 'Réponse en 24h' },
    { icon: '📈', title: 'Graphiques avancés', subtitle: 'Analyse détaillée' },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.screenBg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <LinearGradient colors={theme.gradientHeader} style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerBadge}>PREMIUM</Text>
          <Text style={styles.headerTitle}>Passez à la vitesse supérieure</Text>
          <Text style={styles.headerSubtitle}>Débloquez toutes les fonctionnalités</Text>
        </LinearGradient>

        {/* Fonctionnalités */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Inclus dans Premium :</Text>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureItem, { backgroundColor: theme.cardBg }]}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{feature.title}</Text>
                <Text style={[styles.featureSubtitle, { color: theme.textSecondary }]}>{feature.subtitle}</Text>
              </View>
              <Text style={[styles.checkmark, { color: theme.successColor }]}>✓</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Choisissez votre plan :</Text>

          {/* Mensuel */}
          <TouchableOpacity
            style={[styles.planCard, {
              backgroundColor: theme.cardBg,
              borderColor: selectedPlan === 'monthly' ? theme.accent : theme.inputBorder,
              backgroundColor: selectedPlan === 'monthly' ? theme.accentLight : theme.cardBg,
            }]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, { color: theme.textPrimary }]}>Mensuel</Text>
                <Text style={[styles.planPrice, { color: theme.accent }]}>500 FCFA/mois</Text>
              </View>
              <View style={[styles.radioButton, {
                borderColor: selectedPlan === 'monthly' ? theme.accent : theme.inputBorder,
                backgroundColor: selectedPlan === 'monthly' ? theme.accent : 'transparent',
              }]} />
            </View>
            <Text style={[styles.planDescription, { color: theme.textSecondary }]}>
              Parfait pour essayer Premium
            </Text>
          </TouchableOpacity>

          {/* Annuel */}
          <TouchableOpacity
            style={[styles.planCard, styles.planCardPopular, {
              backgroundColor: selectedPlan === 'yearly' ? theme.accentLight : theme.cardBg,
              borderColor: selectedPlan === 'yearly' ? theme.accent : theme.inputBorder,
            }]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={[styles.popularBadge, { backgroundColor: theme.successColor }]}>
              <Text style={styles.popularBadgeText}>ÉCONOMISEZ 20%</Text>
            </View>
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, { color: theme.textPrimary }]}>Annuel</Text>
                <Text style={[styles.planPrice, { color: theme.accent }]}>5 000 FCFA/an</Text>
                <Text style={[styles.planSavings, { color: theme.successColor }]}>Au lieu de 6 000 FCFA</Text>
              </View>
              <View style={[styles.radioButton, {
                borderColor: selectedPlan === 'yearly' ? theme.accent : theme.inputBorder,
                backgroundColor: selectedPlan === 'yearly' ? theme.accent : 'transparent',
              }]} />
            </View>
            <Text style={[styles.planDescription, { color: theme.textSecondary }]}>
              Meilleure offre - 2 mois gratuits !
            </Text>
          </TouchableOpacity>
        </View>

        {/* Achat */}
        <View style={styles.purchaseSection}>
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: theme.accent }]}
            onPress={() => handlePurchase(
              selectedPlan === 'monthly'
                ? 'budgetpro_premium_monthly'
                : 'budgetpro_premium_yearly'
            )}
            disabled={purchasing}
          >
            {purchasing
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.purchaseButtonText}>Commencer maintenant</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={[styles.restoreButtonText, { color: theme.accent }]}>Restaurer mes achats</Text>
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            Abonnement renouvelé automatiquement. Annulez à tout moment depuis Google Play Store.
          </Text>
        </View>

        {/* Témoignages */}
        <View style={styles.testimonialsSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Ils sont Premium :</Text>
          {[
            { text: "J'ai économisé 150 000 FCFA en 3 mois grâce aux prédictions !", author: '- Amadou K.' },
            { text: "L'export PDF m'a aidé à obtenir mon prêt bancaire", author: '- Fatou D.' },
            { text: 'Le meilleur investissement de 500 FCFA de ma vie !', author: '- Moussa S.' },
          ].map((t, i) => (
            <View key={i} style={[styles.testimonialCard, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.testimonialText, { color: theme.textPrimary }]}>"{t.text}"</Text>
              <Text style={[styles.testimonialAuthor, { color: theme.textSecondary }]}>{t.author}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10 },
  header: { padding: 30, paddingTop: 20, alignItems: 'center' },
  closeButton: {
    position: 'absolute', top: 16, right: 18,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, color: '#fff',
    fontSize: 12, fontWeight: 'bold', marginBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#fff', textAlign: 'center', opacity: 0.9 },
  featuresSection: { padding: 20 },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 14 },
  featureItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, marginBottom: 8,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  featureIcon: { fontSize: 26, marginRight: 14 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  featureSubtitle: { fontSize: 12 },
  checkmark: { fontSize: 20, fontWeight: 'bold' },
  plansSection: { padding: 20, paddingTop: 0 },
  planCard: {
    borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 2,
  },
  planCardPopular: { position: 'relative' },
  popularBadge: {
    position: 'absolute', top: -11, right: 18,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  popularBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { fontSize: 19, fontWeight: 'bold' },
  planPrice: { fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  planSavings: { fontSize: 12, marginTop: 2, textDecorationLine: 'line-through' },
  planDescription: { fontSize: 13 },
  radioButton: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  purchaseSection: { padding: 20, paddingTop: 0 },
  purchaseButton: {
    padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 14,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  purchaseButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  restoreButton: { padding: 12, alignItems: 'center' },
  restoreButtonText: { fontSize: 14, fontWeight: '600' },
  termsText: { fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 15 },
  testimonialsSection: { padding: 20, paddingTop: 0 },
  testimonialCard: {
    padding: 16, borderRadius: 14, marginBottom: 10,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  testimonialText: { fontSize: 13, fontStyle: 'italic', marginBottom: 7, lineHeight: 18 },
  testimonialAuthor: { fontSize: 12, fontWeight: '600' },
});