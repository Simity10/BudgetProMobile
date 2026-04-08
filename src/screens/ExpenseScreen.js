// src/screens/ExpenseScreen.js - Avec Date Picker + Sync Cloud
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import PremiumManager from '../utils/PremiumManager';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MONTHS_LABELS = ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
const YEARS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

export default function ExpenseScreen({ user, navigation }) {
  const { theme } = useTheme();
  const now = new Date();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Alimentation');
  const [description, setDescription] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(String(now.getDate()).padStart(2, '0'));
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const categories = [
    'Alimentation','Transport','Logement','Santé',
    'Loisirs','Shopping','Éducation','Vêtements','Factures','Autre',
  ];

  const getSelectedDate = () => {
    return new Date(`${selectedYear}-${selectedMonth}-${selectedDay}T12:00:00`);
  };

  const formatDisplayDate = () => {
    return `${selectedDay}/${selectedMonth}/${selectedYear}`;
  };

  useFocusEffect(useCallback(() => {
    loadExpenses();
    checkPremiumStatus();
  }, [user]));

  const checkPremiumStatus = async () => {
    const premium = await PremiumManager.checkPremiumStatus();
    setIsPremium(premium);
  };

  const loadExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        const exp = (data.transactions || []).filter(t => t.type === 'expense').reverse();
        setExpenses(exp);
      }
    } catch (e) {}
  };

  const addExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    const txDate = getSelectedDate();
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === txDate.getMonth() && d.getFullYear() === txDate.getFullYear();
    });
    if (!PremiumManager.canAddTransaction(monthExpenses.length)) {
      Alert.alert('Limite atteinte 🔒', `50 transactions atteintes.`, [
        { text: 'Annuler', style: 'cancel' },
        { text: '💎 Premium', onPress: () => navigation.navigate('Paywall') },
      ]);
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      const data = stored ? JSON.parse(stored) : { transactions: [] };
      const newTx = {
        id: Date.now(), type: 'expense',
        amount: parseFloat(amount),
        category,
        description: description || 'Dépense',
        date: txDate.toISOString(),
      };
      data.transactions.push(newTx);
      data.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      await AsyncStorage.setItem(`budgetpro_${user.name}`, JSON.stringify(data));
      setAmount('');
      setDescription('');
      Alert.alert('Succès ✅', 'Dépense ajoutée !');
      // Sync cloud en arrière-plan
      api.syncTransaction({ type: 'expense', amount: newTx.amount, category: newTx.category, description: newTx.description, date: newTx.date, localId: String(newTx.id) }).catch(() => {});
      loadExpenses();
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ajouter");
    }
  };

  const deleteExpense = async (id) => {
    Alert.alert('Confirmation', 'Supprimer cette dépense ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
        const data = JSON.parse(stored);
        data.transactions = data.transactions.filter(t => t.id !== id);
        await AsyncStorage.setItem(`budgetpro_${user.name}`, JSON.stringify(data));
        loadExpenses();
        // Sync suppression cloud
        api.deleteTransaction(String(id)).catch(() => {});
      }},
    ]);
  };

  const monthCount = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>💸 Ajouter une dépense</Text>
          {!isPremium && <Text style={[styles.limitText, { color: theme.warningColor }]}>{monthCount}/50 ce mois</Text>}
        </View>

        <View style={[styles.form, { backgroundColor: theme.cardBg }]}>

          {/* Montant */}
          <Text style={[styles.label, { color: theme.textPrimary }]}>Montant (FCFA)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
            placeholder="Ex: 5 000"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Date */}
          <Text style={[styles.label, { color: theme.textPrimary }]}>Date de la transaction</Text>
          <TouchableOpacity
            style={[styles.dateBtn, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme.textPrimary, fontSize: 16 }}>📅 {formatDisplayDate()}</Text>
          </TouchableOpacity>

          {/* Catégorie */}
          <Text style={[styles.label, { color: theme.textPrimary }]}>Catégorie</Text>
          <View style={[styles.pickerContainer, { borderColor: theme.inputBorder, backgroundColor: theme.pickerBg }]}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={[styles.picker, { color: theme.pickerText }]}
              dropdownIconColor={theme.pickerText}
              mode="dropdown"
            >
              {categories.map(c => (
                <Picker.Item key={c} label={c} value={c} color={theme.pickerText}
                  style={Platform.OS === 'android' ? { backgroundColor: theme.pickerBg, color: theme.pickerText, fontSize: 15 } : undefined}
                />
              ))}
            </Picker>
          </View>

          {/* Description */}
          <Text style={[styles.label, { color: theme.textPrimary }]}>Description (optionnel)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
            placeholder="Ex: Courses du mois"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.dangerColor }]} onPress={addExpense}>
            <Text style={styles.addButtonText}>💸 Ajouter la dépense</Text>
          </TouchableOpacity>
        </View>

        {/* Historique */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📋 Historique ({expenses.length})</Text>
          {expenses.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucune dépense enregistrée</Text>
          ) : (
            expenses.map(exp => (
              <View key={exp.id} style={[styles.txItem, { backgroundColor: theme.cardBg }]}>
                <View style={styles.txDetails}>
                  <Text style={[styles.txDesc, { color: theme.textPrimary }]}>{exp.description}</Text>
                  <Text style={[styles.txAmount, { color: theme.dangerColor }]}>-{exp.amount.toLocaleString('fr-FR')} FCFA</Text>
                  <Text style={[styles.txMeta, { color: theme.textSecondary }]}>
                    {exp.category} • {new Date(exp.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteExpense(exp.id)} style={styles.deleteBtn}>
                  <Text style={{ fontSize: 20 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal Date Picker */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>📅 Choisir la date</Text>
            <View style={styles.datePickerRow}>
              {/* Jour */}
              <View style={styles.datePickerCol}>
                <Text style={[styles.datePickerLabel, { color: theme.textSecondary }]}>Jour</Text>
                <View style={[styles.datePickerBox, { borderColor: theme.inputBorder, backgroundColor: theme.pickerBg }]}>
                  <Picker selectedValue={selectedDay} onValueChange={setSelectedDay}
                    style={{ color: theme.pickerText, width: 100 }} mode="dropdown" dropdownIconColor={theme.pickerText}>
                    {DAYS.map(d => (
                      <Picker.Item key={d} label={d} value={d} color={theme.pickerText}
                        style={{ backgroundColor: theme.pickerBg, color: theme.pickerText, fontSize: 15 }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              {/* Mois */}
              <View style={styles.datePickerCol}>
                <Text style={[styles.datePickerLabel, { color: theme.textSecondary }]}>Mois</Text>
                <View style={[styles.datePickerBox, { borderColor: theme.inputBorder, backgroundColor: theme.pickerBg }]}>
                  <Picker selectedValue={selectedMonth} onValueChange={setSelectedMonth}
                    style={{ color: theme.pickerText, width: 100 }} mode="dropdown" dropdownIconColor={theme.pickerText}>
                    {MONTHS.map((m, i) => (
                      <Picker.Item key={m} label={MONTHS_LABELS[i]} value={m} color={theme.pickerText}
                        style={{ backgroundColor: theme.pickerBg, color: theme.pickerText, fontSize: 15 }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              {/* Année */}
              <View style={styles.datePickerCol}>
                <Text style={[styles.datePickerLabel, { color: theme.textSecondary }]}>Année</Text>
                <View style={[styles.datePickerBox, { borderColor: theme.inputBorder, backgroundColor: theme.pickerBg }]}>
                  <Picker selectedValue={selectedYear} onValueChange={setSelectedYear}
                    style={{ color: theme.pickerText, width: 100 }} mode="dropdown" dropdownIconColor={theme.pickerText}>
                    {YEARS.map(y => (
                      <Picker.Item key={y} label={y} value={y} color={theme.pickerText}
                        style={{ backgroundColor: theme.pickerBg, color: theme.pickerText, fontSize: 15 }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.accent }]} onPress={() => setShowDatePicker(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>✓ Confirmer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  limitText: { fontSize: 12, marginTop: 5, fontWeight: '600' },
  form: {
    padding: 20, marginHorizontal: 15, borderRadius: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { borderWidth: 2, borderRadius: 12, padding: 14, fontSize: 16 },
  dateBtn: { borderWidth: 2, borderRadius: 12, padding: 14 },
  pickerContainer: { borderWidth: 2, borderRadius: 12, overflow: 'hidden' },
  picker: { height: 54 },
  addButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  section: { padding: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  emptyText: { textAlign: 'center', paddingVertical: 30, fontSize: 14 },
  txItem: {
    flexDirection: 'row', padding: 14, borderRadius: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  txDetails: { flex: 1 },
  txDesc: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  txAmount: { fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  txMeta: { fontSize: 12 },
  deleteBtn: { justifyContent: 'center', padding: 8 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 36 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  datePickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  datePickerCol: { alignItems: 'center' },
  datePickerLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  datePickerBox: { borderWidth: 1.5, borderRadius: 10, overflow: 'hidden' },
  confirmBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
});