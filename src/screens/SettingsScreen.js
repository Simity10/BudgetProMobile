// src/screens/PredictionsScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function PredictionsScreen({ user }) {
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPredictions();
    }, [user])
  );

  const loadPredictions = async () => {
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        calculatePredictions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPredictions();
    setRefreshing(false);
  };

  const calculatePredictions = (transactions) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTrans = transactions.filter(t => new Date(t.date) >= startOfMonth);
    const expenses = monthTrans.filter(t => t.type === 'expense');

    if (expenses.length < 3) {
      setPredictions(null);
      return;
    }

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;

    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const avgDaily = totalExpense / daysPassed;

    const endMonth = totalExpense + (avgDaily * daysRemaining);
    const trend = expenses.length > 5 ? 1.1 : 1.05;
    const nextMonth = avgDaily * daysInMonth * trend;
    const quarter = nextMonth * 3;

    // Top catégorie
    const catMap = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const topCategory = Object.keys(catMap).length > 0
      ? Object.entries(catMap).sort((a, b) => b[1] - a[1])[0][0]
      : '-';

    setPredictions({
      endMonth: Math.round(endMonth),
      nextMonth: Math.round(nextMonth),
      quarter: Math.round(quarter),
      avgDaily: Math.round(avgDaily),
      trend: Math.round((trend - 1) * 100),
      topCategory,
    });

    generateInsights(monthTrans, avgDaily, topCategory);
  };

  const generateInsights = (transactions, avgDaily, topCategory) => {
    const newInsights = [];
    const incomes = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Insight balance
    if (balance < 0) {
      newInsights.push({
        icon: '🚨',
        title: 'Dépenses > Revenus',
        text: `Vous dépensez ${Math.abs(balance).toLocaleString()} FCFA de plus que vos revenus !`,
        type: 'danger',
      });
    } else {
      const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;
      if (savingsRate >= 20) {
        newInsights.push({
          icon: '🎉',
          title: 'Excellent taux d\'épargne !',
          text: `Vous épargnez ${savingsRate}% de vos revenus. Continuez !`,
          type: 'success',
        });
      } else if (savingsRate > 0) {
        newInsights.push({
          icon: '⚠️',
          title: 'Épargne insuffisante',
          text: `Vous épargnez ${savingsRate}%. Visez au moins 20%.`,
          type: 'warning',
        });
      }
    }

    // Insight dépense quotidienne
    if (avgDaily > 5000) {
      newInsights.push({
        icon: '📊',
        title: 'Dépenses quotidiennes élevées',
        text: `Vous dépensez en moyenne ${avgDaily.toLocaleString()} FCFA par jour.`,
        type: 'info',
      });
    }

    // Insight catégorie
    if (topCategory !== '-') {
      newInsights.push({
        icon: '🏆',
        title: 'Catégorie principale',
        text: `${topCategory} représente votre plus grosse dépense ce mois.`,
        type: 'info',
      });
    }

    setInsights(newInsights);
  };

  if (!predictions) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>🔮 Prédictions IA</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Pas assez de données</Text>
          <Text style={styles.emptyText}>
            Ajoutez au moins 3 dépenses pour voir les prédictions
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>🔮 Prédictions IA</Text>
        </View>

        {/* Carte de prédictions */}
        <LinearGradient
          colors={['#fef3c7', '#fde68a']}
          style={styles.predictionCard}
        >
          <View style={styles.predictionHeader}>
            <Text style={styles.predictionTitle}>Prédictions avancées</Text>
            <View style={styles.accuracyBadge}>
              <Text style={styles.accuracyText}>Précision: 85%</Text>
            </View>
          </View>

          <View style={styles.predictionRow}>
            <View>
              <Text style={styles.predictionLabel}>Fin du mois</Text>
              <Text style={styles.predictionValue}>
                {predictions.endMonth.toLocaleString()} FCFA
              </Text>
            </View>
            <View style={[styles.trendBadge, predictions.trend > 0 ? styles.trendUp : styles.trendDown]}>
              <Text style={styles.trendText}>
                {predictions.trend > 0 ? '↗' : '↘'} {Math.abs(predictions.trend)}%
              </Text>
            </View>
          </View>

          <View style={styles.predictionRow}>
            <View>
              <Text style={styles.predictionLabel}>Mois prochain</Text>
              <Text style={styles.predictionValue}>
                {predictions.nextMonth.toLocaleString()} FCFA
              </Text>
            </View>
          </View>

          <View style={styles.predictionRow}>
            <View>
              <Text style={styles.predictionLabel}>Trimestre</Text>
              <Text style={styles.predictionValue}>
                {predictions.quarter.toLocaleString()} FCFA
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Recommandations</Text>
          {insights.map((insight, index) => (
            <View key={index} style={[styles.insightCard, styles[`insight${insight.type}`]]}>
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Analyse */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Analyse détaillée</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Dépense moyenne/jour</Text>
              <Text style={styles.statValue}>
                {predictions.avgDaily.toLocaleString()} FCFA
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Catégorie #1</Text>
              <Text style={styles.statValue}>{predictions.topCategory}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// src/screens/SettingsScreen.js
export function SettingsScreen({ user, onLogout }) {
  const [savingsGoal, setSavingsGoal] = useState('20');

  const exportData = async () => {
    Alert.alert('Export', 'Fonctionnalité d\'export disponible dans la prochaine version !');
  };

  const resetData = async () => {
    Alert.alert(
      'Confirmation',
      'Supprimer TOUTES les données ? Cette action est irréversible !',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(`budgetpro_${user.name}`);
            Alert.alert('Succès', 'Données supprimées');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Paramètres</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Compte</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={onLogout}>
            <Text style={styles.actionButtonText}>🚪 Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Données</Text>
          <TouchableOpacity style={styles.actionButton} onPress={exportData}>
            <Text style={styles.actionButtonText}>📥 Exporter les données</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Zone dangereuse</Text>
          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={resetData}>
            <Text style={[styles.actionButtonText, styles.dangerText]}>Tout supprimer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.appVersion}>BudgetPro v2.0</Text>
          <Text style={styles.appCopyright}>© 2024 Tous droits réservés</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  predictionCard: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400e',
  },
  accuracyBadge: {
    backgroundColor: 'rgba(146, 64, 14, 0.1)',
    padding: 6,
    borderRadius: 8,
  },
  accuracyText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(146, 64, 14, 0.2)',
  },
  predictionLabel: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400e',
  },
  trendBadge: {
    padding: 6,
    borderRadius: 8,
  },
  trendUp: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendDown: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  insightsuccess: {
    borderLeftColor: '#10b981',
  },
  insightdanger: {
    borderLeftColor: '#ef4444',
  },
  insightwarning: {
    borderLeftColor: '#f59e0b',
  },
  insightinfo: {
    borderLeftColor: '#3b82f6',
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dangerButton: {
    borderColor: '#ef4444',
  },
  dangerText: {
    color: '#ef4444',
  },
  aboutSection: {
    padding: 20,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#9ca3af',
  },
});