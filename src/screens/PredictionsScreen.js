// src/screens/PredictionsScreen.js - IA conseillère financière
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

export default function PredictionsScreen({ user }) {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [advices, setAdvices] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    loadAndAnalyze();
  }, [user]));

  const loadAndAnalyze = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        const trans = data.transactions || [];
        setTransactions(trans);
        analyzeFinances(trans);
      }
    } catch (e) {}
    setLoading(false);
  };

  const analyzeFinances = (trans) => {
    const now = new Date();
    // Mois courant
    const monthTrans = trans.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthIncome = monthTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthExpense = monthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = monthIncome - monthExpense;
    const savingsRate = monthIncome > 0 ? (balance / monthIncome) * 100 : 0;

    // Dépenses par catégorie ce mois
    const catExpenses = {};
    monthTrans.filter(t => t.type === 'expense').forEach(t => {
      catExpenses[t.category] = (catExpenses[t.category] || 0) + t.amount;
    });
    const topCat = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);

    // Prédiction mois suivant (moyenne des 3 derniers mois)
    const last3Months = [0, 1, 2].map(i => {
      const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      return trans.filter(t => {
        const td = new Date(t.date);
        return t.type === 'expense' && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      }).reduce((s, t) => s + t.amount, 0);
    }).filter(v => v > 0);

    const avgExpense = last3Months.length > 0
      ? last3Months.reduce((s, v) => s + v, 0) / last3Months.length
      : monthExpense;

    // Tendance
    const trend = last3Months.length >= 2
      ? (last3Months[0] > last3Months[1] ? 'hausse' : 'baisse')
      : 'stable';

    setPredictions({
      nextMonthEstimate: Math.round(avgExpense),
      trend,
      savingsRate: savingsRate.toFixed(1),
      monthIncome, monthExpense, balance,
      daysLeft: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate(),
      dailyBudget: balance > 0 ? Math.round(balance / Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate())) : 0,
    });

    // Conseils IA
    const newAdvices = [];

    if (savingsRate >= 30) {
      newAdvices.push({ type: 'success', icon: '🌟', title: 'Excellent taux d\'épargne !', text: `Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus. Continuez ainsi !` });
    } else if (savingsRate >= 15) {
      newAdvices.push({ type: 'info', icon: '👍', title: 'Bon taux d\'épargne', text: `Votre taux d'épargne de ${savingsRate.toFixed(0)}% est correct. Essayez d'atteindre 30%.` });
    } else if (savingsRate > 0) {
      newAdvices.push({ type: 'warning', icon: '⚠️', title: 'Taux d\'épargne faible', text: `Vous n'épargnez que ${savingsRate.toFixed(0)}% de vos revenus. Réduisez vos dépenses.` });
    } else if (savingsRate <= 0 && monthIncome > 0) {
      newAdvices.push({ type: 'danger', icon: '🚨', title: 'Budget déficitaire !', text: 'Vos dépenses dépassent vos revenus ce mois. Réduisez vos dépenses urgemment.' });
    }

    if (topCat.length > 0) {
      const [topName, topAmt] = topCat[0];
      const topPct = monthExpense > 0 ? ((topAmt / monthExpense) * 100).toFixed(0) : 0;
      if (topPct > 40) {
        newAdvices.push({ type: 'warning', icon: '📊', title: `Forte dépense : ${topName}`, text: `${topPct}% de vos dépenses vont en "${topName}" (${topAmt.toLocaleString('fr-FR')} FCFA). Cherchez à réduire cette catégorie.` });
      } else {
        newAdvices.push({ type: 'info', icon: '📊', title: `Top dépense : ${topName}`, text: `Votre principale catégorie est "${topName}" avec ${topAmt.toLocaleString('fr-FR')} FCFA (${topPct}% du total).` });
      }
    }

    if (trend === 'hausse') {
      newAdvices.push({ type: 'warning', icon: '📈', title: 'Dépenses en hausse', text: 'Vos dépenses augmentent par rapport aux mois précédents. Faites attention à ne pas dépasser votre budget.' });
    } else if (trend === 'baisse') {
      newAdvices.push({ type: 'success', icon: '📉', title: 'Dépenses en baisse', text: 'Vos dépenses diminuent par rapport aux mois précédents. Bon travail !' });
    }

    if (monthIncome === 0) {
      newAdvices.push({ type: 'info', icon: '💰', title: 'Pas de revenus enregistrés', text: 'Commencez par enregistrer vos revenus pour obtenir une analyse complète.' });
    }

    if (trans.length < 3) {
      newAdvices.push({ type: 'info', icon: '📝', title: 'Données insuffisantes', text: 'Ajoutez plus de transactions pour obtenir des conseils personnalisés plus précis.' });
    }

    if (predictions?.dailyBudget > 0) {
      newAdvices.push({ type: 'info', icon: '📅', title: 'Budget quotidien disponible', text: `Il vous reste ${predictions?.dailyBudget?.toLocaleString('fr-FR')} FCFA/jour pour finir le mois à l'équilibre.` });
    }

    setAdvices(newAdvices);
  };

  const getAdviceColor = (type) => {
    switch (type) {
      case 'success': return theme.successColor;
      case 'warning': return theme.warningColor;
      case 'danger': return theme.dangerColor;
      default: return theme.accent;
    }
  };

  const getAdviceBg = (type) => {
    switch (type) {
      case 'success': return theme.successColor + '15';
      case 'warning': return theme.warningColor + '15';
      case 'danger': return theme.dangerColor + '15';
      default: return theme.accent + '15';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

        <LinearGradient colors={theme.gradientHeader} style={styles.header}>
          <Text style={styles.headerTitle}>🔮 IA Conseillère Financière</Text>
          <Text style={styles.headerSub}>Analyse intelligente de vos finances</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Prédiction mois suivant */}
            {predictions && (
              <View style={[styles.predCard, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                <Text style={styles.predTitle}>🔮 Prédiction mois prochain</Text>
                <Text style={styles.predAmount}>{predictions.nextMonthEstimate.toLocaleString('fr-FR')} FCFA</Text>
                <Text style={styles.predSub}>
                  de dépenses estimées • Tendance {predictions.trend === 'hausse' ? '📈 hausse' : predictions.trend === 'baisse' ? '📉 baisse' : '➡️ stable'}
                </Text>
              </View>
            )}

            {/* Résumé du mois */}
            {predictions && (
              <View style={[styles.summaryCard, { backgroundColor: theme.cardBg }]}>
                <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>📊 Résumé du mois</Text>
                <View style={styles.summaryGrid}>
                  {[
                    { label: 'Revenus', value: predictions.monthIncome.toLocaleString('fr-FR') + ' F', color: theme.successColor },
                    { label: 'Dépenses', value: predictions.monthExpense.toLocaleString('fr-FR') + ' F', color: theme.dangerColor },
                    { label: 'Taux épargne', value: predictions.savingsRate + '%', color: theme.accent },
                    { label: 'Jours restants', value: predictions.daysLeft + ' jours', color: theme.textPrimary },
                  ].map((item, i) => (
                    <View key={i} style={[styles.summaryItem, { backgroundColor: theme.screenBg }]}>
                      <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
                      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Reporting journalier */}
                {predictions.dailyBudget > 0 && (
                  <View style={[styles.dailyBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                    <Text style={[styles.dailyTitle, { color: theme.accent }]}>💡 Budget quotidien recommandé</Text>
                    <Text style={[styles.dailyAmount, { color: theme.accent }]}>
                      {predictions.dailyBudget.toLocaleString('fr-FR')} FCFA/jour
                    </Text>
                    <Text style={[styles.dailySub, { color: theme.textSecondary }]}>
                      Pour terminer le mois à l'équilibre ({predictions.daysLeft} jours restants)
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Conseils IA */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🤖 Conseils personnalisés</Text>
              {advices.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.cardBg }]}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Ajoutez des transactions pour recevoir des conseils personnalisés.
                  </Text>
                </View>
              ) : (
                advices.map((advice, i) => (
                  <View key={i} style={[styles.adviceCard, {
                    backgroundColor: getAdviceBg(advice.type),
                    borderLeftColor: getAdviceColor(advice.type),
                  }]}>
                    <Text style={styles.adviceIcon}>{advice.icon}</Text>
                    <View style={styles.adviceContent}>
                      <Text style={[styles.adviceTitle, { color: getAdviceColor(advice.type) }]}>{advice.title}</Text>
                      <Text style={[styles.adviceText, { color: theme.textPrimary }]}>{advice.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={[styles.refreshBtn, { backgroundColor: theme.accent }]}
              onPress={loadAndAnalyze}
            >
              <Text style={styles.refreshBtnText}>🔄 Actualiser l'analyse</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#fff', opacity: 0.85 },
  predCard: {
    margin: 16, padding: 20, borderRadius: 16, alignItems: 'center',
    borderWidth: 2, elevation: 2,
  },
  predTitle: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 8 },
  predAmount: { fontSize: 28, fontWeight: 'bold', color: '#92400e', marginBottom: 4 },
  predSub: { fontSize: 13, color: '#92400e', opacity: 0.8 },
  summaryCard: {
    margin: 16, marginTop: 4, padding: 16, borderRadius: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  summaryItem: { width: '47%', padding: 12, borderRadius: 12, alignItems: 'center' },
  summaryValue: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  summaryLabel: { fontSize: 11 },
  dailyBox: { padding: 14, borderRadius: 12, borderWidth: 1.5 },
  dailyTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  dailyAmount: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  dailySub: { fontSize: 12 },
  section: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  adviceCard: {
    flexDirection: 'row', padding: 14, borderRadius: 14, marginBottom: 10,
    borderLeftWidth: 4,
  },
  adviceIcon: { fontSize: 26, marginRight: 12, marginTop: 2 },
  adviceContent: { flex: 1 },
  adviceTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  adviceText: { fontSize: 13, lineHeight: 20 },
  emptyCard: { padding: 30, borderRadius: 16, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  refreshBtn: { margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  refreshBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});