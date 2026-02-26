// src/screens/IncomeScreen.js
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

export default function IncomeScreen({ user }) {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salaire');
  const [description, setDescription] = useState('');
  const [incomes, setIncomes] = useState([]);

  const sources = ['Salaire', 'Freelance', 'Investissement', 'Bonus', 'Cadeau', 'Autre'];

  useFocusEffect(
    useCallback(() => {
      loadIncomes();
    }, [user])
  );

  const loadIncomes = async () => {
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (stored) {
        const data = JSON.parse(stored);
        const incomeTransactions = (data.transactions || [])
          .filter(t => t.type === 'income')
          .reverse();
        setIncomes(incomeTransactions);
      }
    } catch (error) {
      console.error('Error loading incomes:', error);
    }
  };

  const addIncome = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      const data = stored ? JSON.parse(stored) : { transactions: [] };

      const newIncome = {
        id: Date.now(),
        type: 'income',
        amount: parseFloat(amount),
        category: source,
        description: description || 'Revenu',
        date: new Date().toISOString(),
      };

      data.transactions.push(newIncome);
      await AsyncStorage.setItem(`budgetpro_${user.name}`, JSON.stringify(data));

      setAmount('');
      setDescription('');
      Alert.alert('Succès', '💰 Revenu ajouté !');
      loadIncomes();
    } catch (error) {
      console.error('Error adding income:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le revenu');
    }
  };

  const deleteIncome = async (id) => {
    Alert.alert(
      'Confirmation',
      'Supprimer ce revenu ?',
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
              loadIncomes();
            } catch (error) {
              console.error('Error deleting income:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>💰 Ajouter un revenu</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Montant (FCFA)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 150000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Source</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={source}
              onValueChange={setSource}
              style={styles.picker}
            >
              {sources.map(s => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Salaire du mois"
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.addButton} onPress={addIncome}>
            <Text style={styles.addButtonText}>💰 Ajouter le revenu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📋 Historique des revenus ({incomes.length})
          </Text>
          {incomes.length === 0 ? (
            <Text style={styles.emptyText}>Aucun revenu enregistré</Text>
          ) : (
            incomes.map(income => (
              <View key={income.id} style={styles.incomeItem}>
                <View style={styles.incomeDetails}>
                  <Text style={styles.incomeDescription}>{income.description}</Text>
                  <Text style={styles.incomeAmount}>
                    +{income.amount.toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text style={styles.incomeInfo}>
                    {income.category} • {new Date(income.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteIncome(income.id)}
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

// src/screens/ExpenseScreen.js - Similaire à IncomeScreen
// Je vais créer une version simplifiée ci-dessous

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
    backgroundColor: '#10b981',
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
  },
  incomeItem: {
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
  incomeDetails: {
    flex: 1,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  incomeInfo: {
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