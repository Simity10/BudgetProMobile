// src/screens/DashboardScreen.js - Simplifié + graphiques
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CATEGORIES_COLORS = ['#667eea','#f093fb','#4facfe','#43e97b','#fa709a','#fee140','#a18cd1','#fda085','#84fab0'];

export default function DashboardScreen({ user, onLogout, navigation }) {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0, rate: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activeChart, setActiveChart] = useState('categories');

  useFocusEffect(useCallback(() => { loadData(); }, [user]));

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        const trans = data.transactions || [];
        setTransactions(trans);
        calculateStats(trans);
        calculateCategoryData(trans);
        calculateMonthlyData(trans);
      }
    } catch (e) {}
  };

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const calculateStats = (trans) => {
    const now = new Date();
    const monthTrans = trans.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = monthTrans.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const rate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
    setStats({ income, expense, balance, rate });
  };

  const calculateCategoryData = (trans) => {
    const now = new Date();
    const monthExpenses = trans.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const byCategory = {};
    let total = 0;
    monthExpenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      total += t.amount;
    });
    const data = Object.entries(byCategory)
      .map(([name, amount]) => ({ name, amount, pct: total > 0 ? (amount / total * 100).toFixed(1) : 0 }))
      .sort((a, b) => b.amount - a.amount);
    setCategoryData(data);
  };

  const calculateMonthlyData = (trans) => {
    const months = {};
    trans.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      if (t.type === 'income') months[key].income += t.amount;
      else months[key].expense += t.amount;
    });
    const sorted = Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => ({
        label: key.slice(5) + '/' + key.slice(2, 4),
        ...val,
      }));
    setMonthlyData(sorted);
  };

  const fmt = (n) => n.toLocaleString('fr-FR') + ' F';
  const recentTrans = transactions.slice(-5).reverse();

  // Graphique barres horizontal pour catégories
  const maxCatAmount = categoryData.length > 0 ? categoryData[0].amount : 1;

  // Graphique barres vertical pour mensuel
  const maxMonthly = monthlyData.length > 0
    ? Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1)
    : 1;
  const barWidth = monthlyData.length > 0 ? (CHART_WIDTH - 40) / (monthlyData.length * 2 + monthlyData.length) : 30;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <LinearGradient colors={theme.gradientHeader} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Bonjour 👋</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
          {/* Solde principal */}
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Solde net du mois</Text>
            <Text style={[styles.balanceAmount, { color: stats.balance >= 0 ? '#4ade80' : '#f87171' }]}>
              {stats.balance >= 0 ? '+' : ''}{fmt(stats.balance)}
            </Text>
          </View>
        </LinearGradient>

        {/* Vue d'ensemble - 4 cards */}
        <View style={styles.overviewGrid}>
          {[
            { label: 'Revenus', value: fmt(stats.income), icon: '💰', color: theme.successColor },
            { label: 'Dépenses', value: fmt(stats.expense), icon: '💸', color: theme.dangerColor },
            { label: 'Solde', value: fmt(stats.balance), icon: '💼', color: stats.balance >= 0 ? theme.successColor : theme.dangerColor },
            { label: 'Épargne', value: stats.rate + '%', icon: '🏦', color: theme.accent },
          ].map((item, i) => (
            <View key={i} style={[styles.overviewCard, { backgroundColor: theme.cardBg }]}>
              <Text style={styles.overviewIcon}>{item.icon}</Text>
              <Text style={[styles.overviewValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Graphiques */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBg }]}>
          {/* Tabs graphiques */}
          <View style={styles.chartTabs}>
            {[
              { key: 'categories', label: '🍕 Catégories' },
              { key: 'monthly', label: '📅 Mensuel' },
              { key: 'comparison', label: '⚖️ Rev/Dep' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.chartTab, activeChart === tab.key && { backgroundColor: theme.accent }]}
                onPress={() => setActiveChart(tab.key)}
              >
                <Text style={[styles.chartTabText, activeChart === tab.key && { color: '#fff' }]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Graphique catégories */}
          {activeChart === 'categories' && (
            <View style={styles.chartContent}>
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Dépenses ce mois</Text>
              {categoryData.length === 0 ? (
                <Text style={[styles.emptyChart, { color: theme.textSecondary }]}>Aucune dépense ce mois</Text>
              ) : (
                categoryData.slice(0, 6).map((cat, i) => (
                  <View key={cat.name} style={styles.barRow}>
                    <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{cat.name}</Text>
                    <View style={[styles.barBg, { backgroundColor: theme.inputBorder }]}>
                      <View style={[styles.barFill, {
                        width: `${(cat.amount / maxCatAmount) * 100}%`,
                        backgroundColor: CATEGORIES_COLORS[i % CATEGORIES_COLORS.length],
                      }]} />
                    </View>
                    <Text style={[styles.barPct, { color: theme.textSecondary }]}>{cat.pct}%</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Graphique mensuel */}
          {activeChart === 'monthly' && (
            <View style={styles.chartContent}>
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Évolution des dépenses (6 mois)</Text>
              {monthlyData.length === 0 ? (
                <Text style={[styles.emptyChart, { color: theme.textSecondary }]}>Pas encore de données</Text>
              ) : (
                <View style={styles.barChart}>
                  <View style={styles.barsContainer}>
                    {monthlyData.map((m, i) => (
                      <View key={i} style={styles.barGroup}>
                        <View style={styles.verticalBars}>
                          <View style={[styles.vBar, {
                            height: Math.max((m.expense / maxMonthly) * 120, 2),
                            backgroundColor: theme.dangerColor,
                            width: barWidth,
                          }]} />
                        </View>
                        <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>{m.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.dangerColor }]} />
                      <Text style={[styles.legendText, { color: theme.textSecondary }]}>Dépenses</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Revenus vs Dépenses */}
          {activeChart === 'comparison' && (
            <View style={styles.chartContent}>
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Revenus vs Dépenses (6 mois)</Text>
              {monthlyData.length === 0 ? (
                <Text style={[styles.emptyChart, { color: theme.textSecondary }]}>Pas encore de données</Text>
              ) : (
                <View style={styles.barChart}>
                  <View style={styles.barsContainer}>
                    {monthlyData.map((m, i) => (
                      <View key={i} style={styles.barGroup}>
                        <View style={styles.verticalBars}>
                          <View style={[styles.vBar, {
                            height: Math.max((m.income / maxMonthly) * 120, 2),
                            backgroundColor: theme.successColor,
                            width: barWidth,
                            marginRight: 2,
                          }]} />
                          <View style={[styles.vBar, {
                            height: Math.max((m.expense / maxMonthly) * 120, 2),
                            backgroundColor: theme.dangerColor,
                            width: barWidth,
                          }]} />
                        </View>
                        <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>{m.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.successColor }]} />
                      <Text style={[styles.legendText, { color: theme.textSecondary }]}>Revenus</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.dangerColor }]} />
                      <Text style={[styles.legendText, { color: theme.textSecondary }]}>Dépenses</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Transactions récentes */}
        <View style={[styles.recentCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🕐 Transactions récentes</Text>
          {recentTrans.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucune transaction</Text>
          ) : (
            recentTrans.map(t => (
              <View key={t.id} style={[styles.transItem, { borderBottomColor: theme.inputBorder }]}>
                <Text style={styles.transIcon}>{t.type === 'income' ? '💰' : '💸'}</Text>
                <View style={styles.transInfo}>
                  <Text style={[styles.transDesc, { color: theme.textPrimary }]}>{t.description}</Text>
                  <Text style={[styles.transMeta, { color: theme.textSecondary }]}>
                    {t.category} • {new Date(t.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={[styles.transAmount, { color: t.type === 'income' ? theme.successColor : theme.dangerColor }]}>
                  {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('fr-FR')} F
                </Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { color: '#fff', fontSize: 14, opacity: 0.85 },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  balanceBox: { alignItems: 'center', paddingVertical: 8 },
  balanceLabel: { color: '#fff', fontSize: 13, opacity: 0.85, marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold' },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  overviewCard: {
    width: (width - 40) / 2,
    padding: 14, borderRadius: 14, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  overviewIcon: { fontSize: 24, marginBottom: 6 },
  overviewValue: { fontSize: 15, fontWeight: 'bold', marginBottom: 3, textAlign: 'center' },
  overviewLabel: { fontSize: 11 },
  chartCard: {
    margin: 16, marginTop: 4, borderRadius: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  chartTabs: { flexDirection: 'row', padding: 8, gap: 6 },
  chartTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  chartTabText: { fontSize: 10, fontWeight: '600', color: '#6b7280', textAlign: 'center' },
  chartContent: { padding: 16 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 14 },
  emptyChart: { textAlign: 'center', padding: 20, fontSize: 13 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 80, fontSize: 11 },
  barBg: { flex: 1, height: 14, borderRadius: 7, overflow: 'hidden', marginHorizontal: 6 },
  barFill: { height: 14, borderRadius: 7 },
  barPct: { width: 36, fontSize: 11, textAlign: 'right' },
  barChart: { alignItems: 'center' },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 140, marginBottom: 8 },
  barGroup: { alignItems: 'center', marginHorizontal: 4 },
  verticalBars: { flexDirection: 'row', alignItems: 'flex-end' },
  vBar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  monthLabel: { fontSize: 9, marginTop: 4 },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  recentCard: {
    margin: 16, marginTop: 4, padding: 16, borderRadius: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { textAlign: 'center', padding: 16, fontSize: 13 },
  transItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  transIcon: { fontSize: 22, marginRight: 10 },
  transInfo: { flex: 1 },
  transDesc: { fontSize: 14, fontWeight: '600' },
  transMeta: { fontSize: 11, marginTop: 2 },
  transAmount: { fontSize: 14, fontWeight: 'bold' },
});