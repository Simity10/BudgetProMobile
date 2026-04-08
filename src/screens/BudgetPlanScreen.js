// src/screens/BudgetPlanScreen.js - Planification de budget
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const CATEGORIES = [
  { key: 'Alimentation', icon: '🍽️' },
  { key: 'Transport', icon: '🚌' },
  { key: 'Logement', icon: '🏠' },
  { key: 'Santé', icon: '💊' },
  { key: 'Loisirs', icon: '🎭' },
  { key: 'Shopping', icon: '🛍️' },
  { key: 'Éducation', icon: '📚' },
  { key: 'Factures', icon: '📄' },
  { key: 'Autre', icon: '📦' },
];

export default function BudgetPlanScreen({ user }) {
  const { theme } = useTheme();
  const [budgets, setBudgets] = useState({
    monthly: '', annual: '',
    categories: {},
  });
  const [actualExpenses, setActualExpenses] = useState({});
  const [editing, setEditing] = useState(false);
  const [tempBudgets, setTempBudgets] = useState({});

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
      loadActualExpenses();
    }, [user])
  );

  const loadBudgets = async () => {
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_budgets_${user.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        setBudgets(data);
        setTempBudgets(data);
      } else {
        const def = { monthly: '', annual: '', categories: {} };
        setBudgets(def);
        setTempBudgets(def);
      }
    } catch (e) {}
  };

  const loadActualExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (!stored) return;
      const data = JSON.parse(stored);
      const now = new Date();
      const monthTrans = (data.transactions || []).filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
      });
      const byCategory = {};
      let total = 0;
      monthTrans.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        total += t.amount;
      });
      byCategory._total = total;
      setActualExpenses(byCategory);
    } catch (e) {}
  };

  const saveBudgets = async () => {
    try {
      await AsyncStorage.setItem(`budgetpro_budgets_${user.name}`, JSON.stringify(tempBudgets));
      setBudgets(tempBudgets);
      setEditing(false);
      Alert.alert('✅ Enregistré', 'Vos budgets ont été sauvegardés.');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    }
  };

  const getPercent = (actual, budget) => {
    if (!budget || parseFloat(budget) === 0) return null;
    return Math.round((actual / parseFloat(budget)) * 100);
  };

  const getBarColor = (pct) => {
    if (pct === null) return theme.inputBorder;
    if (pct >= 100) return theme.dangerColor;
    if (pct >= 80) return theme.warningColor;
    return theme.successColor;
  };

  const totalMonthlyBudget = parseFloat(budgets.monthly) || 0;
  const totalSpent = actualExpenses._total || 0;
  const globalPct = getPercent(totalSpent, budgets.monthly);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

        {/* Header */}
        <LinearGradient colors={theme.gradientHeader} style={styles.header}>
          <Text style={styles.headerTitle}>🎯 Planification Budget</Text>
          <Text style={styles.headerSub}>Définissez et suivez vos budgets</Text>
        </LinearGradient>

        {/* Budget global mensuel */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>📅 Budget mensuel global</Text>

          {editing ? (
            <TextInput
              style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg, color: theme.textPrimary }]}
              placeholder="Ex: 150 000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={tempBudgets.monthly}
              onChangeText={v => setTempBudgets({ ...tempBudgets, monthly: v })}
            />
          ) : (
            <Text style={[styles.budgetValue, { color: theme.accent }]}>
              {budgets.monthly ? parseFloat(budgets.monthly).toLocaleString('fr-FR') + ' FCFA' : 'Non défini'}
            </Text>
          )}

          {/* Barre de progression globale */}
          {!editing && globalPct !== null && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBg, { backgroundColor: theme.inputBorder }]}>
                <View style={[styles.progressBar, {
                  width: `${Math.min(globalPct, 100)}%`,
                  backgroundColor: getBarColor(globalPct),
                }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                  {totalSpent.toLocaleString('fr-FR')} FCFA dépensés
                </Text>
                <Text style={[styles.progressPct, { color: getBarColor(globalPct) }]}>{globalPct}%</Text>
              </View>
              {globalPct >= 100 && (
                <View style={[styles.alertBanner, { backgroundColor: theme.dangerColor + '20', borderColor: theme.dangerColor }]}>
                  <Text style={[styles.alertText, { color: theme.dangerColor }]}>
                    ⚠️ Budget mensuel dépassé de {(totalSpent - totalMonthlyBudget).toLocaleString('fr-FR')} FCFA !
                  </Text>
                </View>
              )}
              {globalPct >= 80 && globalPct < 100 && (
                <View style={[styles.alertBanner, { backgroundColor: theme.warningColor + '20', borderColor: theme.warningColor }]}>
                  <Text style={[styles.alertText, { color: theme.warningColor }]}>
                    🔔 Attention : {100 - globalPct}% du budget restant
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Budget annuel */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>📆 Budget annuel</Text>
          {editing ? (
            <TextInput
              style={[styles.input, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg, color: theme.textPrimary }]}
              placeholder="Ex: 1 800 000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={tempBudgets.annual}
              onChangeText={v => setTempBudgets({ ...tempBudgets, annual: v })}
            />
          ) : (
            <Text style={[styles.budgetValue, { color: theme.accent }]}>
              {budgets.annual ? parseFloat(budgets.annual).toLocaleString('fr-FR') + ' FCFA' : 'Non défini'}
            </Text>
          )}
        </View>

        {/* Budgets par catégorie */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>📊 Budget par catégorie</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Ce mois-ci</Text>

          {CATEGORIES.map(cat => {
            const budgetVal = budgets.categories?.[cat.key] || '';
            const actual = actualExpenses[cat.key] || 0;
            const pct = getPercent(actual, budgetVal);

            return (
              <View key={cat.key} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryName, { color: theme.textPrimary }]}>{cat.key}</Text>
                  {editing ? (
                    <TextInput
                      style={[styles.catInput, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg, color: theme.textPrimary }]}
                      placeholder="Budget"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={tempBudgets.categories?.[cat.key] || ''}
                      onChangeText={v => setTempBudgets({
                        ...tempBudgets,
                        categories: { ...tempBudgets.categories, [cat.key]: v },
                      })}
                    />
                  ) : (
                    <Text style={[styles.categoryBudget, { color: theme.textSecondary }]}>
                      {budgetVal ? parseFloat(budgetVal).toLocaleString('fr-FR') + ' F' : '-'}
                    </Text>
                  )}
                </View>

                {!editing && pct !== null && (
                  <View style={styles.catProgress}>
                    <View style={[styles.progressBg, { backgroundColor: theme.inputBorder }]}>
                      <View style={[styles.progressBar, {
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: getBarColor(pct),
                      }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                        {actual.toLocaleString('fr-FR')} FCFA
                      </Text>
                      <Text style={[styles.progressPct, { color: getBarColor(pct) }]}>{pct}%</Text>
                    </View>
                    {pct >= 100 && (
                      <Text style={[styles.overBudget, { color: theme.dangerColor }]}>
                        ⚠️ Dépassé !
                      </Text>
                    )}
                  </View>
                )}

                {!editing && pct === null && actual > 0 && (
                  <Text style={[styles.actualOnly, { color: theme.textSecondary }]}>
                    Dépensé : {actual.toLocaleString('fr-FR')} FCFA (pas de budget défini)
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Boutons */}
        {editing ? (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: theme.inputBorder }]}
              onPress={() => { setEditing(false); setTempBudgets(budgets); }}
            >
              <Text style={[styles.btnSecondaryText, { color: theme.textPrimary }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
              onPress={saveBudgets}
            >
              <Text style={styles.btnPrimaryText}>💾 Enregistrer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: theme.accent, marginHorizontal: 20 }]}
            onPress={() => { setEditing(true); setTempBudgets(budgets); }}
          >
            <Text style={styles.btnPrimaryText}>✏️ Modifier les budgets</Text>
          </TouchableOpacity>
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
  card: {
    margin: 16, marginBottom: 8, padding: 18, borderRadius: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, marginBottom: 12 },
  budgetValue: { fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  input: { borderWidth: 2, borderRadius: 10, padding: 12, fontSize: 16, marginTop: 8 },
  progressSection: { marginTop: 12 },
  progressBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressBar: { height: 10, borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 12 },
  progressPct: { fontSize: 12, fontWeight: 'bold' },
  alertBanner: {
    marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1,
  },
  alertText: { fontSize: 13, fontWeight: '600' },
  categoryItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  categoryIcon: { fontSize: 20, marginRight: 10 },
  categoryName: { flex: 1, fontSize: 14, fontWeight: '600' },
  categoryBudget: { fontSize: 13 },
  catInput: { borderWidth: 1.5, borderRadius: 8, padding: 6, fontSize: 13, width: 100 },
  catProgress: { paddingLeft: 30 },
  overBudget: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  actualOnly: { fontSize: 12, paddingLeft: 30, marginTop: 2 },
  btnRow: { flexDirection: 'row', margin: 16, gap: 12 },
  btnPrimary: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  btnSecondary: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  btnSecondaryText: { fontSize: 15, fontWeight: '600' },
});