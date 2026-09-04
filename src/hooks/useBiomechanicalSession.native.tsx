import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { SportId, SportRule, AnalysisResult, SavedReport } from '../types';
import { SPORTS_RULES } from '../data/sportsRules';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BiomechanicalSessionContextType {
  activeTab: 'audit' | 'dashboard' | 'saved' | 'games';
  setActiveTab: (tab: 'audit' | 'dashboard' | 'saved' | 'games') => void;
  selectedSportId: SportId;
  setSelectedSportId: (id: SportId) => void;
  currentSportRule: SportRule;
  customVideoUri: string | null;
  setCustomVideoUri: (uri: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analysisProgress: number;
  setAnalysisProgress: (progress: number) => void;
  analysisStage: string;
  setAnalysisStage: (stage: string) => void;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (res: AnalysisResult | null) => void;
  savedReports: any[];
  saveReportToRoster: (report: any) => Promise<void>;
  deleteSavedReport: (id: string) => Promise<void>;
  openSavedReport: (item: any) => void;
  resetSession: () => void;
}

const BiomechanicalSessionContext = createContext<BiomechanicalSessionContextType | null>(null);

export const BiomechanicalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'dashboard' | 'saved' | 'games'>('audit');
  const [selectedSportId, setSelectedSportId] = useState<SportId>('golf');
  const [customVideoUri, setCustomVideoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStage, setAnalysisStage] = useState<string>('Initializing');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  const currentSportRule: SportRule = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];

  useEffect(() => {
    const loadReports = async () => {
      try {
        const stored = await AsyncStorage.getItem('@klutchh_saved_reports_v2');
        if (stored) {
          setSavedReports(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load saved reports:', err);
      }
    };
    loadReports();
  }, []);

  const saveReportToRoster = async (newReport: any) => {
    try {
      const updated = [newReport, ...savedReports];
      setSavedReports(updated);
      await AsyncStorage.setItem('@klutchh_saved_reports_v2', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save report to roster:', err);
    }
  };

  const deleteSavedReport = async (id: string) => {
    try {
      const updated = savedReports.filter((r) => r.id !== id);
      setSavedReports(updated);
      await AsyncStorage.setItem('@klutchh_saved_reports_v2', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const openSavedReport = (item: any) => {
    if (item.sportId) {
      setSelectedSportId(item.sportId);
    }
    if (item.videoUrl) {
      setCustomVideoUri(item.videoUrl);
    }
    setAnalysisResult({
      keyframes: item.keyframeList || [],
      allFrames: item.allFrames || [],
      aiReport: item.report || null,
      overallSymmetry: item.overallSymmetry ?? 88,
      overallKneeSafety: item.overallKneeSafety ?? 92,
      measuredAngles: {},
      ruleResultsSummary: {},
      sequenceComparison: item.sequenceComparison || {
        ideal: [],
        actual: [],
        isCorrect: true,
        feedback: 'Standard kinetic sequencing',
      },
      kineticSequence: item.kineticSequence || {
        steps: [],
        firingOrder: [],
        isCorrectOrder: true,
        sequenceEfficiency: 90,
      },
      dynamicMetrics: item.dynamicMetrics,
    });
    setActiveTab('audit');
  };

  const resetSession = () => {
    setAnalysisResult(null);
    setCustomVideoUri(null);
    setIsAnalyzing(false);
  };

  return (
    <BiomechanicalSessionContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedSportId,
        setSelectedSportId,
        currentSportRule,
        customVideoUri,
        setCustomVideoUri,
        isAnalyzing,
        setIsAnalyzing,
        analysisProgress,
        setAnalysisProgress,
        analysisStage,
        setAnalysisStage,
        analysisResult,
        setAnalysisResult,
        savedReports,
        saveReportToRoster,
        deleteSavedReport,
        openSavedReport,
        resetSession,
      }}
    >
      {children}
    </BiomechanicalSessionContext.Provider>
  );
};

export const useBiomechanicalSession = () => {
  const context = useContext(BiomechanicalSessionContext);
  if (!context) {
    throw new Error('useBiomechanicalSession must be used within a BiomechanicalSessionProvider');
  }
  return context;
};
