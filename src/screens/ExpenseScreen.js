// src/screens/ExpenseScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';

export default function ExpenseScreen({ user }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Alimentation');
  const [description, setDescription] = useState('');
  const [expenses, setExpenses] = useState([]);

  const categories = [
    'Alimentation',
    'Transport',
    'Logement',
    'Santé',
    'Loisirs',
    'Shopping',
    'Éducation',
    'Autre',
  ];

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [user])
  );

  const loadExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        const expenseTransactions = (data.transactions || [])
          .filter(t => t.type === 'expense')
          .reverse();
        setExpenses(expenseTransactions);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const addExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      const data = stored ? JSON.parse(stored) : { transactions: [] };

      const newExpense = {
        id: Date.now(),
        type: 'expense',
        amount: parseFloat(amount),
        category,
        description: description || 'Dépense',
        date: new Date().toISOString(),
      };

      data.transactions.push(newExpense);
      await AsyncStorage.setItem(`budgetpro_${user.name}`, JSON.stringify(data));

      setAmount('');
      setDescription('');
      Alert.alert('Succès', '💸 Dépense ajoutée !');
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la dépense');
    }
  };

  const deleteExpense = async (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer cette dépense ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
              const data = JSON.parse(stored);
              data.transactions = data.transactions.filter(t => t.id !== id);
              await AsyncStorage.setItem(`budgetpro_${user.name}`, JSON.stringify(data));
              loadExpenses();
            } catch (error) {
              console.error('Error deleting expense:', error);
            }
          },
        },
      ]
    );
  };

  const getCategoryStats = () => {
    const stats = {};
    expenses.forEach(exp => {
      stats[exp.category] = (stats[exp.category] || 0) + exp.amount;
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>💸 Ajouter une dépense</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Montant (FCFA)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 5000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={styles.picker}
            >
              {categories.map(c => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Courses du mois"
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.addButton} onPress={addExpense}>
            <Text style={styles.addButtonText}>💸 Ajouter la dépense</Text>
          </TouchableOpacity>
        </View>

        {/* Top 3 Catégories */}
        {getCategoryStats().length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>📊 Top 3 catégories</Text>
            {getCategoryStats().map(([cat, amount], index) => (
              <View key={cat} style={styles.statItem}>
                <View style={styles.statRank}>
                  <Text style={styles.statRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.statCategory}>{cat}</Text>
                <Text style={styles.statAmount}>
                  {amount.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📋 Historique des dépenses ({expenses.length})
          </Text>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>Aucune dépense enregistrée</Text>
          ) : (
            expenses.map(expense => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseDetails}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseAmount}>
                    -{expense.amount.toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text style={styles.expenseInfo}>
                    {expense.category} • {new Date(expense.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteExpense(expense.id)}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
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
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  form: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  addButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsSection: {
    padding: 20,
    paddingTop: 15,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  statRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statRankText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  expenseItem: {
    flexDirection: 'row',
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
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  expenseInfo: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    justifyContent: 'center',
    padding: 10,
  },
  deleteIcon: {
    fontSize: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 30,
  },
});