import AsyncStorage from '@react-native-async-storage/async-storage';

// Changer cette URL selon ton environnement
const API_URL = 'http://192.168.1.100:5000/api';

class ApiService {
  constructor() {
    this.token = null;
  }

  // Configurer l'URL du serveur
  static setBaseUrl(url) {
    API_URL = url;
  }

  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...options
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur serveur');
      }

      return data;
    } catch (error) {
      if (error.message === 'Network request failed') {
        console.log('Mode hors-ligne: impossible de contacter le serveur');
        return null;
      }
      throw error;
    }
  }

  // === AUTH ===

  async register(name, identifier, password) {
    const isEmail = identifier.includes('@');
    const body = {
      name,
      password,
      ...(isEmail ? { email: identifier } : { phone: identifier })
    };

    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (data?.token) {
      this.token = data.token;
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data));
    }

    return data;
  }

  async login(identifier, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    if (data?.token) {
      this.token = data.token;
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data));
    }

    return data;
  }

  async getProfile() {
    return await this.request('/auth/me');
  }

  async logout() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  // === TRANSACTIONS ===

  async syncTransaction(transaction) {
    return await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  }

  async deleteTransaction(localId) {
    return await this.request(`/transactions/${localId}`, {
      method: 'DELETE'
    });
  }

  async getTransactions(type) {
    const query = type ? `?type=${type}` : '';
    return await this.request(`/transactions${query}`);
  }

  // === BUDGETS ===

  async syncBudgets(budgets) {
    return await this.request('/budgets', {
      method: 'PUT',
      body: JSON.stringify(budgets)
    });
  }

  async getBudgets() {
    return await this.request('/budgets');
  }

  // === SYNC COMPLÈTE ===

  async backup(data) {
    return await this.request('/sync/backup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async restore() {
    return await this.request('/sync/restore');
  }
}

export default new ApiService();
