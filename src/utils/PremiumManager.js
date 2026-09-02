// src/utils/PremiumManager.js - Premium lié à chaque utilisateur
import AsyncStorage from '@react-native-async-storage/async-storage';

class PremiumManager {
  constructor() {
    this.isPremium = false;
    this.currentUser = null;
  }

  // Clé unique par utilisateur
  _key() {
    return this.currentUser
      ? `premium_status_${this.currentUser}`
      : 'premium_status_default';
  }

  async initialize(username = null) {
    this.currentUser = username;
    this.isPremium = false; // Reset par défaut
    try {
      const stored = await AsyncStorage.getItem(this._key());
      if (stored) {
        const data = JSON.parse(stored);
        this.isPremium = data.isPremium || false;
      }
    } catch (e) {}
  }

  async checkPremiumStatus(username = null) {
    if (username) this.currentUser = username;
    this.isPremium = false;
    try {
      const stored = await AsyncStorage.getItem(this._key());
      if (stored) {
        const data = JSON.parse(stored);
        this.isPremium = data.isPremium || false;
      }
    } catch (e) {}
    return this.isPremium;
  }

  async getProducts() {
    return [
      { productId: 'budgetpro_premium_monthly', localizedPrice: '500 FCFA' },
      { productId: 'budgetpro_premium_yearly', localizedPrice: '5 000 FCFA' },
    ];
  }

  async purchaseSubscription(sku) {
    this.isPremium = true;
    await AsyncStorage.setItem(this._key(), JSON.stringify({ isPremium: true }));
    // Garder aussi la clé globale pour SettingsScreen
    await AsyncStorage.setItem('premium_status', JSON.stringify({ isPremium: true }));
    return true;
  }

  async restorePurchases() {
    return this.isPremium;
  }

  async revokePremium() {
    this.isPremium = false;
    await AsyncStorage.setItem(this._key(), JSON.stringify({ isPremium: false }));
    await AsyncStorage.setItem('premium_status', JSON.stringify({ isPremium: false }));
  }

  canAddTransaction(transactionCount) {
    if (this.isPremium) return true;
    return transactionCount < 50;
  }

  canExportData() { return this.isPremium; }
  canAccessAdvancedPredictions() { return this.isPremium; }
  canSyncCloud() { return this.isPremium; }
}

const premiumManager = new PremiumManager();
export default premiumManager;