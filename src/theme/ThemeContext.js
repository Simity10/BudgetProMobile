// src/theme/ThemeContext.js
import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEMES = {
  violet: {
    key: 'violet',
    name: '🟣 Violet Pro',
    gradientHeader: ['#667eea', '#764ba2'],
    gradientLogin: ['#667eea', '#764ba2'],
    accent: '#667eea',
    accentLight: '#f0f4ff',
    incomeGradient: ['#10b981', '#059669'],
    expenseGradient: ['#ef4444', '#dc2626'],
    balanceGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    tabActive: '#667eea',
    tabBg: '#ffffff',
    tabBorder: '#e5e7eb',
    successColor: '#10b981',
    dangerColor: '#ef4444',
    warningColor: '#f59e0b',
    infoColor: '#3b82f6',
    cardBg: '#ffffff',
    screenBg: '#f9fafb',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    inputBorder: '#e5e7eb',
    inputBg: '#ffffff',
    pickerBg: '#ffffff',
    pickerText: '#1f2937',
  },
  ocean: {
    key: 'ocean',
    name: '🌊 Océan',
    gradientHeader: ['#0077B6', '#00B4D8'],
    gradientLogin: ['#023E8A', '#0077B6'],
    accent: '#0077B6',
    accentLight: '#e0f4ff',
    incomeGradient: ['#0a9396', '#005f73'],
    expenseGradient: ['#ae2012', '#9b2226'],
    balanceGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    tabActive: '#0077B6',
    tabBg: '#ffffff',
    tabBorder: '#caf0f8',
    successColor: '#0a9396',
    dangerColor: '#ae2012',
    warningColor: '#e9c46a',
    infoColor: '#0077B6',
    cardBg: '#ffffff',
    screenBg: '#f0f9ff',
    textPrimary: '#03045e',
    textSecondary: '#48cae4',
    inputBorder: '#caf0f8',
    inputBg: '#ffffff',
    pickerBg: '#ffffff',
    pickerText: '#03045e',
  },
  sunset: {
    key: 'sunset',
    name: '🌅 Coucher de soleil',
    gradientHeader: ['#FF6B35', '#F7931E'],
    gradientLogin: ['#c9184a', '#ff4d6d'],
    accent: '#FF6B35',
    accentLight: '#fff0eb',
    incomeGradient: ['#2d6a4f', '#40916c'],
    expenseGradient: ['#c9184a', '#ff4d6d'],
    balanceGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    tabActive: '#FF6B35',
    tabBg: '#fffbf7',
    tabBorder: '#ffe8d6',
    successColor: '#2d6a4f',
    dangerColor: '#c9184a',
    warningColor: '#FF6B35',
    infoColor: '#4361ee',
    cardBg: '#ffffff',
    screenBg: '#fffbf7',
    textPrimary: '#370617',
    textSecondary: '#6c584c',
    inputBorder: '#ffe8d6',
    inputBg: '#ffffff',
    pickerBg: '#ffffff',
    pickerText: '#370617',
  },
  dark: {
    key: 'dark',
    name: '🌙 Nuit sombre',
    gradientHeader: ['#1a1a2e', '#16213e'],
    gradientLogin: ['#0f0c29', '#302b63'],
    accent: '#e94560',
    accentLight: '#2d2d44',
    incomeGradient: ['#198754', '#0f5132'],
    expenseGradient: ['#dc3545', '#842029'],
    balanceGradient: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)'],
    tabActive: '#e94560',
    tabBg: '#1a1a2e',
    tabBorder: '#2d2d44',
    successColor: '#198754',
    dangerColor: '#dc3545',
    warningColor: '#ffc107',
    infoColor: '#0dcaf0',
    cardBg: '#16213e',
    screenBg: '#0f0c29',
    textPrimary: '#f1f1f1',
    textSecondary: '#a0a0b0',
    inputBorder: '#2d2d44',
    inputBg: '#1a1a2e',
    pickerBg: '#1a1a2e',
    pickerText: '#f1f1f1',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState('violet');

  const theme = THEMES[themeKey];

  const changeTheme = async (key) => {
    setThemeKey(key);
    try {
      await AsyncStorage.setItem('app_theme', key);
    } catch {}
  };

  React.useEffect(() => {
    AsyncStorage.getItem('app_theme').then((k) => {
      if (k && THEMES[k]) setThemeKey(k);
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeKey, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}