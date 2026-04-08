// src/screens/SettingsScreen.js - Compatible Expo Go
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../theme/ThemeContext';

export default function SettingsScreen({ user, onLogout, navigation }) {
  const { theme, themeKey, changeTheme, themes } = useTheme();
  const [isPremium, setIsPremium] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(20);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(useCallback(() => {
    loadSettings();
  }, [user]));

  const loadSettings = async () => {
    try {
      // Lire le statut premium lié à l'utilisateur
      const prem = await AsyncStorage.getItem(`premium_status_${user.name}`);
      if (prem) setIsPremium(JSON.parse(prem).isPremium || false);
      else setIsPremium(false);

      const notif = await AsyncStorage.getItem(`budgetpro_notif_${user.name}`);
      if (notif) {
        const n = JSON.parse(notif);
        setNotifEnabled(n.enabled || false);
        setNotifHour(n.hour || 20);
      }
    } catch (e) {}
  };

  const saveNotifSettings = async (enabled, hour) => {
    try {
      await AsyncStorage.setItem(`budgetpro_notif_${user.name}`, JSON.stringify({ enabled, hour }));
    } catch (e) {}
  };

  const toggleNotif = (val) => {
    setNotifEnabled(val);
    saveNotifSettings(val, notifHour);
    if (val) {
      Alert.alert('🔔 Rappel activé',
        `Préférence de rappel à ${notifHour}h00 sauvegardée.\n\nLes notifications en arrière-plan seront actives dans le build de production.`);
    }
  };

  const changeHour = (dir) => {
    const newHour = Math.min(23, Math.max(6, notifHour + dir));
    setNotifHour(newHour);
    saveNotifSettings(notifEnabled, newHour);
  };

  // Export CSV — téléchargement direct dans Downloads
  const exportCSV = async () => {
    setExporting(true);
    try {
      const stored = await AsyncStorage.getItem(`budgetpro_${user.name}`);
      if (!stored) { Alert.alert('Aucune donnée', 'Pas de transactions à exporter.'); setExporting(false); return; }
      const data = JSON.parse(stored);
      const trans = data.transactions || [];
      if (trans.length === 0) { Alert.alert('Aucune donnée', 'Pas de transactions à exporter.'); setExporting(false); return; }

      const BOM = '\uFEFF';
      const header = 'Date,Type,Montant (FCFA),Catégorie,Description\n';
      const rows = trans.map(t => {
        const date = new Date(t.date).toLocaleDateString('fr-FR');
        const type = t.type === 'income' ? 'Revenu' : 'Dépense';
        const desc = (t.description || '').replace(/"/g, '""');
        const cat = (t.category || '').replace(/"/g, '""');
        return `${date},${type},${t.amount},"${cat}","${desc}"`;
      }).join('\n');

      const csvContent = BOM + header + rows;
      const fileName = `BudgetPro_${user.name}_${new Date().toISOString().slice(0, 10)}.csv`;

      // Écrire dans le cache puis partager
      const cachePath = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(cachePath, csvContent, { encoding: 'utf8' });

      // Vérifier disponibilité du partage
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Non disponible', 'Le partage de fichiers n\'est pas disponible sur cet appareil.');
        setExporting(false);
        return;
      }

      // Partager — Android proposera "Enregistrer dans Fichiers / Downloads"
      await Sharing.shareAsync(cachePath, {
        mimeType: 'text/csv',
        dialogTitle: `Enregistrer ${fileName}`,
        UTI: 'public.comma-separated-values-text',
      });

      Alert.alert('✅ Export réussi', `Fichier : ${fileName}\n\nChoisissez "Enregistrer dans Fichiers" ou "Downloads" dans la boîte de dialogue.`);

    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'exporter : ' + e.message);
    }
    setExporting(false);
  };

  const deleteAllData = () => {
    Alert.alert('⚠️ Supprimer toutes les données', 'Cette action est irréversible. Toutes vos transactions seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem(`budgetpro_${user.name}`);
        await AsyncStorage.removeItem(`budgetpro_budgets_${user.name}`);
        Alert.alert('✅ Données supprimées');
      }},
    ]);
  };

  const themeList = [
    { key: 'violet', label: '🟣 Violet Pro' },
    { key: 'ocean', label: '🌊 Océan' },
    { key: 'sunset', label: '🌅 Coucher de soleil' },
    { key: 'dark', label: '🌙 Nuit sombre' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <LinearGradient colors={theme.gradientHeader} style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.avatar}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userStatus}>{isPremium ? '💎 Utilisateur Premium' : '🆓 Utilisateur Gratuit'}</Text>
        </LinearGradient>

        {/* Premium */}
        {!isPremium && (
          <TouchableOpacity onPress={() => navigation.navigate('Paywall')} style={styles.premiumBanner}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.premiumGrad}>
              <Text style={styles.premiumIcon}>💎</Text>
              <View style={styles.premiumContent}>
                <Text style={styles.premiumTitle}>Passer à Premium</Text>
                <Text style={styles.premiumText}>500 FCFA/mois • Transactions illimitées</Text>
              </View>
              <Text style={styles.premiumArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Thèmes */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🎨 Thème de l'application</Text>
          <View style={styles.themeGrid}>
            {themeList.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.themeCard, {
                  borderColor: themeKey === t.key ? theme.accent : theme.inputBorder,
                  borderWidth: themeKey === t.key ? 2.5 : 1.5,
                  backgroundColor: theme.screenBg,
                }]}
                onPress={() => changeTheme(t.key)}
              >
                <LinearGradient colors={themes[t.key].gradientHeader} style={styles.themePreview} />
                <Text style={[styles.themeLabel, { color: theme.textPrimary }]}>{t.label}</Text>
                {themeKey === t.key && <Text style={[styles.themeCheck, { color: theme.accent }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>🔔 Notifications de rappel</Text>

          <View style={[styles.row, { borderBottomColor: theme.inputBorder }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Rappel quotidien</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                "N'oubliez pas d'enregistrer vos dépenses"
              </Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={toggleNotif}
              trackColor={{ false: theme.inputBorder, true: theme.accent }}
              thumbColor={notifEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {notifEnabled && (
            <View style={styles.hourRow}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Heure du rappel</Text>
              <View style={styles.hourControl}>
                <TouchableOpacity style={[styles.hourBtn, { backgroundColor: theme.accent }]} onPress={() => changeHour(-1)}>
                  <Text style={styles.hourBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.hourValue, { color: theme.textPrimary }]}>{notifHour}h00</Text>
                <TouchableOpacity style={[styles.hourBtn, { backgroundColor: theme.accent }]} onPress={() => changeHour(1)}>
                  <Text style={styles.hourBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Export */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📤 Exporter les données</Text>
          <Text style={[styles.exportInfo, { color: theme.textSecondary }]}>
            Exportez toutes vos transactions au format CSV (compatible Excel et Google Sheets)
          </Text>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: theme.accent }]}
            onPress={exportCSV}
            disabled={exporting}
          >
            <Text style={styles.exportBtnText}>{exporting ? '⏳ Export en cours...' : '📊 Exporter en CSV'}</Text>
          </TouchableOpacity>
        </View>

        {/* Compte */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>👤 Compte</Text>
          <View style={[styles.infoRow, { borderBottomColor: theme.inputBorder }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Utilisateur</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{user.name}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: theme.inputBorder }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Statut</Text>
            <Text style={[styles.infoValue, { color: isPremium ? theme.successColor : theme.textPrimary }]}>
              {isPremium ? '💎 Premium' : '🆓 Gratuit'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Membre depuis</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {new Date(user.joinDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.warningColor + '20', borderColor: theme.warningColor }]} onPress={deleteAllData}>
            <Text style={[styles.actionBtnText, { color: theme.warningColor }]}>🗑️ Supprimer toutes les données</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.dangerColor + '20', borderColor: theme.dangerColor }]} onPress={onLogout}>
            <Text style={[styles.actionBtnText, { color: theme.dangerColor }]}>🚪 Se déconnecter</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 30, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  userStatus: { fontSize: 13, color: '#fff', opacity: 0.9 },
  premiumBanner: { margin: 16, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  premiumGrad: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  premiumIcon: { fontSize: 30, marginRight: 14 },
  premiumContent: { flex: 1 },
  premiumTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  premiumText: { color: '#fff', fontSize: 13, opacity: 0.9 },
  premiumArrow: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  section: { margin: 16, marginTop: 8, padding: 18, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: { width: '47%', borderRadius: 12, overflow: 'hidden', paddingBottom: 8 },
  themePreview: { height: 50, width: '100%' },
  themeLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 6, paddingHorizontal: 4 },
  themeCheck: { textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  rowSub: { fontSize: 12 },
  hourRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  hourControl: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  hourBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  hourBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold', lineHeight: 22 },
  hourValue: { fontSize: 18, fontWeight: 'bold', minWidth: 55, textAlign: 'center' },
  exportInfo: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  exportBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  actionsSection: { padding: 16, gap: 10 },
  actionBtn: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
});