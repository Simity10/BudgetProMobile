// src/screens/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen({ user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    rate: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        setTransactions(data.transactions || []);
        calculateStats(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateStats = (trans) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTrans = trans.filter(t => new Date(t.date) >= startOfMonth);
    
    const income = monthTrans
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTrans
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    const rate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

    setStats({ income, expense, balance, rate });
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  const getRecentTransactions = () => {
    return transactions.slice(-5).reverse();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header avec gradient */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.avatar}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userDate}>
                  Membre depuis {new Date(user.joinDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutIcon}>🚪</Text>
            </TouchableOpacity>
          </View>

          {/* Cartes de stats */}
          <View style={styles.statsCards}>
            <View style={[styles.statCard, styles.statCardIncome]}>
              <Text style={styles.statLabel}>💰 Revenus</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.income)}</Text>
            </View>
            <View style={[styles.statCard, styles.statCardExpense]}>
              <Text style={styles.statLabel}>💸 Dépenses</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.expense)}</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardBalance, stats.balance >= 0 ? styles.positive : styles.negative]}>
            <Text style={styles.statLabel}>💼 Solde disponible</Text>
            <Text style={styles.statValueLarge}>{formatCurrency(stats.balance)}</Text>
          </View>
        </LinearGradient>

        {/* Vue d'ensemble */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>
          <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, styles.incomeCard]}>
              <Text style={styles.overviewLabel}>Revenus mensuels</Text>
              <Text style={[styles.overviewValue, styles.positiveText]}>
                {formatCurrency(stats.income)}
              </Text>
            </View>
            <View style={[styles.overviewCard, styles.expenseCard]}>
              <Text style={styles.overviewLabel}>Dépenses mensuelles</Text>
              <Text style={[styles.overviewValue, styles.negativeText]}>
                {formatCurrency(stats.expense)}
              </Text>
            </View>
            <View style={[styles.overviewCard, styles.balanceCard]}>
              <Text style={styles.overviewLabel}>Solde net</Text>
              <Text style={styles.overviewValue}>{formatCurrency(stats.balance)}</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Taux d'épargne</Text>
              <Text style={styles.overviewValue}>{stats.rate}%</Text>
            </View>
          </View>
        </View>

        {/* Transactions récentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Transactions récentes</Text>
          {getRecentTransactions().length === 0 ? (
            <Text style={styles.emptyText}>Aucune transaction</Text>
          ) : (
            getRecentTransactions().map((transaction, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionEmoji}>
                    {transaction.type === 'income' ? '💰' : '💸'}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text
                    style={[
                      styles.transactionValue,
                      transaction.type === 'income' ? styles.positiveText : styles.negativeText
                    ]}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            ))
          )}
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
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDate: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  logoutBtn: {
    padding: 8,
  },
  logoutIcon: {
    fontSize: 24,
  },
  statsCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  statCardIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statCardExpense: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statCardBalance: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  positive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  negative: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statValueLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  expenseCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  balanceCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  positiveText: {
    color: '#10b981',
  },
  negativeText: {
    color: '#ef4444',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 20,
  },
});