// App.js - Avec authentification cloud et sync
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Alert } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import IncomeScreen from './src/screens/IncomeScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import PredictionsScreen from './src/screens/PredictionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import AboutScreen from './src/screens/AboutScreen';
import BudgetPlanScreen from './src/screens/BudgetPlanScreen';
import PremiumManager from './src/utils/PremiumManager';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import api from './src/services/api';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator({ currentUser, handleLogout }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 68 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          paddingHorizontal: 0,
          borderTopWidth: 1,
          borderTopColor: theme.tabBorder,
          backgroundColor: theme.tabBg,
          elevation: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          textAlign: 'center',
          marginTop: 1,
          marginBottom: 0,
        },
        tabBarIconStyle: { marginTop: 0, marginBottom: 0 },
      }}
    >
      <Tab.Screen name="Dashboard" options={{ tabBarLabel: 'Accueil', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }}>
        {props => <DashboardScreen {...props} user={currentUser} onLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Income" options={{ tabBarLabel: 'Revenus', tabBarIcon: () => <Text style={{ fontSize: 20 }}>💰</Text> }}>
        {props => <IncomeScreen {...props} user={currentUser} />}
      </Tab.Screen>
      <Tab.Screen name="Expense" options={{ tabBarLabel: 'Dépense', tabBarIcon: () => <Text style={{ fontSize: 20 }}>💸</Text> }}>
        {props => <ExpenseScreen {...props} user={currentUser} />}
      </Tab.Screen>
      <Tab.Screen name="Budget" options={{ tabBarLabel: 'Budget', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎯</Text> }}>
        {props => <BudgetPlanScreen {...props} user={currentUser} />}
      </Tab.Screen>
      <Tab.Screen name="Predictions" options={{ tabBarLabel: 'IA', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔮</Text> }}>
        {props => <PredictionsScreen {...props} user={currentUser} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" options={{ tabBarLabel: 'Plus', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }}>
        {props => <SettingsScreen {...props} user={currentUser} onLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen name="About" component={AboutScreen} options={{ tabBarLabel: 'Aide', tabBarIcon: () => <Text style={{ fontSize: 20 }}>❓</Text> }} />
    </Tab.Navigator>
  );
}

function AppNavigator({ currentUser, handleLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {props => <TabNavigator {...props} currentUser={currentUser} handleLogout={handleLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const user = await AsyncStorage.getItem('currentUser');
      const token = await AsyncStorage.getItem('auth_token');
      if (user) {
        const parsed = JSON.parse(user);
        setCurrentUser(parsed);
        setIsLoggedIn(true);
        if (token) {
          api.setToken(token);
        }
        await initializePremium(parsed.name);
      }
    } catch (e) {}
    finally { setIsLoading(false); }
  };

  const initializePremium = async (username = null) => {
    try { await PremiumManager.initialize(username); } catch (e) {}
  };

  const restoreDataFromCloud = async (userData) => {
    try {
      const cloudData = await api.restore();
      if (!cloudData) return;

      // Restaurer les transactions
      if (cloudData.transactions && cloudData.transactions.length > 0) {
        const incomes = cloudData.transactions.filter(t => t.type === 'income');
        const expenses = cloudData.transactions.filter(t => t.type === 'expense');

        if (incomes.length > 0) {
          await AsyncStorage.setItem(
            `incomes_${userData.name}`,
            JSON.stringify(incomes.map(t => ({
              id: t.localId,
              amount: String(t.amount),
              source: t.category,
              description: t.description,
              date: t.date
            })))
          );
        }
        if (expenses.length > 0) {
          await AsyncStorage.setItem(
            `expenses_${userData.name}`,
            JSON.stringify(expenses.map(t => ({
              id: t.localId,
              amount: String(t.amount),
              category: t.category,
              description: t.description,
              date: t.date
            })))
          );
        }
      }

      // Restaurer les budgets
      if (cloudData.budgets) {
        await AsyncStorage.setItem(
          `budgets_${userData.name}`,
          JSON.stringify(cloudData.budgets)
        );
      }

      // Restaurer les paramètres
      if (cloudData.settings && cloudData.settings.theme) {
        await AsyncStorage.setItem('app_theme', cloudData.settings.theme);
      }

      console.log('Données restaurées depuis le cloud');
    } catch (error) {
      console.log('Erreur restauration cloud:', error.message);
    }
  };

  const handleLogin = async (username, serverData) => {
    const user = serverData
      ? {
          _id: serverData._id,
          name: serverData.name,
          email: serverData.email,
          phone: serverData.phone,
          avatar: serverData.avatar || username.charAt(0).toUpperCase(),
          isPremium: serverData.isPremium,
          joinDate: serverData.joinDate || new Date().toISOString(),
        }
      : {
          name: username,
          joinDate: new Date().toISOString(),
          avatar: username.charAt(0).toUpperCase(),
        };

    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    await initializePremium(user.name);
    setCurrentUser(user);
    setIsLoggedIn(true);

    // Restaurer les données depuis le cloud si connecté au serveur
    if (serverData) {
      await restoreDataFromCloud(user);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    await AsyncStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  if (isLoading) return null;
  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;
  return <AppNavigator currentUser={currentUser} handleLogout={handleLogout} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
