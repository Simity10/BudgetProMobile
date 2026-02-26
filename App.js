// App.js - Point d'entrée principal
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

// Import des écrans
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import IncomeScreen from './src/screens/IncomeScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import PredictionsScreen from './src/screens/PredictionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const user = await AsyncStorage.getItem('currentUser');
      if (user) {
        setCurrentUser(JSON.parse(user));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error checking login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (username) => {
    const user = {
      name: username,
      joinDate: new Date().toISOString(),
      avatar: username.charAt(0).toUpperCase(),
    };
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  if (isLoading) {
    return null; // Ou un splash screen
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#667eea',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarStyle: {
              paddingBottom: 8,
              paddingTop: 8,
              height: 65,
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
            headerShown: false,
          }}
        >
          <Tab.Screen 
            name="Dashboard" 
            options={{
              tabBarLabel: 'Accueil',
              tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>📊</Text>,
            }}
          >
            {props => <DashboardScreen {...props} user={currentUser} onLogout={handleLogout} />}
          </Tab.Screen>
          
          <Tab.Screen 
            name="Income" 
            options={{
              tabBarLabel: 'Revenus',
              tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>💰</Text>,
            }}
          >
            {props => <IncomeScreen {...props} user={currentUser} />}
          </Tab.Screen>
          
          <Tab.Screen 
            name="Expense" 
            options={{
              tabBarLabel: 'Dépenses',
              tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>💸</Text>,
            }}
          >
            {props => <ExpenseScreen {...props} user={currentUser} />}
          </Tab.Screen>
          
          <Tab.Screen 
            name="Predictions" 
            options={{
              tabBarLabel: 'IA',
              tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>🔮</Text>,
            }}
          >
            {props => <PredictionsScreen {...props} user={currentUser} />}
          </Tab.Screen>
          
          <Tab.Screen 
            name="Settings" 
            options={{
              tabBarLabel: 'Plus',
              tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>⚙️</Text>,
            }}
          >
            {props => <SettingsScreen {...props} user={currentUser} onLogout={handleLogout} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
