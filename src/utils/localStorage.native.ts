import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult } from '../types';

const STORAGE_KEY = '@biomechanic_reports_v2';

export const LocalStore = {
  async saveReport(id: string, result: AnalysisResult) {
    try {
      const existing = await this.getAllReports();
      const updated = { ...existing, [id]: result };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save report locally', e);
    }
  },

  async getAllReports(): Promise<Record<string, AnalysisResult>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to load reports locally', e);
      return {};
    }
  },

  async getReport(id: string): Promise<AnalysisResult | null> {
    const all = await this.getAllReports();
    return all[id] || null;
  },

  async deleteReport(id: string) {
    try {
      const all = await this.getAllReports();
      delete all[id];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to delete report', e);
    }
  }
};
