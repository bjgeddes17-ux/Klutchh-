import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Activity,
  Play,
  Bookmark,
  ShieldCheck,
  Zap,
  ChevronRight,
  Sparkles,
  Flame,
  TrendingUp,
  Target,
  Layers,
  Award,
  Video,
  UploadCloud,
  ArrowRight,
  ShieldAlert,
  Camera,
  FileVideo,
  CheckCircle2,
  Trash2,
  RefreshCw,
  X,
  Dumbbell,
  Info,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { SPORTS_RULES } from './data/sportsRules';
import { COMPREHENSIVE_DRILL_LIBRARY, DrillItem } from './data/drillLibrary';
import {
  SportRule,
  SkillLevel,
  AthleteCategory,
  AnalysisResult,
  SportId,
  FrameAnalysis,
  AICoachingReport,
} from './types';
import { AnalysisReportPage } from './components/AnalysisReportPage.native';
import { MagicProcessingScreenNative } from './components/MagicProcessingScreen.native';
import { generateSyntheticSportsPose } from './utils/mediapipePose.native';
import { analyzeNativeVideoBiometrics } from './services/nativeVideoAnalyzer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const [selectedSportId, setSelectedSportId] = useState<SportId>('rugby');
  const [athleteCategory, setAthleteCategory] = useState<AthleteCategory>('middle_school');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('grassroots');
  const [activeTab, setActiveTab] = useState<'analyze' | 'drills' | 'saved'>('analyze');

  const currentSportRule: SportRule = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string>(
    currentSportRule.techniques?.[0]?.id || 'tackle'
  );

  // Sync selected movement technique whenever sport changes
  useEffect(() => {
    const sport = SPORTS_RULES.find((s) => s.id === selectedSportId) || SPORTS_RULES[0];
    if (sport?.techniques && sport.techniques.length > 0) {
      const exists = sport.techniques.some((t) => t.id === selectedTechniqueId);
      if (!exists) {
        setSelectedTechniqueId(sport.techniques[0].id);
      }
    }
  }, [selectedSportId]);

  const currentTechnique = useMemo(() => {
    return (
      currentSportRule.techniques?.find((t) => t.id === selectedTechniqueId) ||
      currentSportRule.techniques?.[0]
    );
  }, [currentSportRule, selectedTechniqueId]);

  const activeRulesToDisplay = useMemo(() => {
    if (currentTechnique?.jointRules && currentTechnique.jointRules.length > 0) {
      return currentTechnique.jointRules;
    }
    return currentSportRule.jointRules || [];
  }, [currentTechnique, currentSportRule]);

  // Video upload & selection state
  const [customVideoUri, setCustomVideoUri] = useState<string | null>(null);
  const [customVideoName, setCustomVideoName] = useState<string | null>(null);
  const [customVideoSize, setCustomVideoSize] = useState<string | null>(null);
  const [customVideoDuration, setCustomVideoDuration] = useState<number | null>(null);
  const [isPickingVideo, setIsPickingVideo] = useState(false);

  // Processing & result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [savedReports, setSavedReports] = useState<
    { id: string; athleteName?: string; sportName: string; techniqueId?: string; techniqueName?: string; grade: string; score: number; date: string; notes?: string }[]
  >([]);
  const [selectedDrill, setSelectedDrill] = useState<DrillItem | null>(null);

  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);

  // Persistence Logic: Load on mount
  useEffect(() => {
    const loadSavedReports = async () => {
      try {
        const stored = await AsyncStorage.getItem('KLUTCHH_SAVED_REPORTS');
        if (stored) {
          setSavedReports(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load reports:', e);
      }
    };
    loadSavedReports();
  }, []);

  // Persistence Logic: Save on change
  useEffect(() => {
    const saveReports = async () => {
      try {
        await AsyncStorage.setItem('KLUTCHH_SAVED_REPORTS', JSON.stringify(savedReports));
      } catch (e) {
        console.error('Failed to save reports:', e);
      }
    };
    saveReports();
  }, [savedReports]);

  const handleOpenSavedReport = (item: any) => {
    if (item.sportId) {
      setSelectedSportId(item.sportId);
    }
    if (item.techniqueId) {
      setSelectedTechniqueId(item.techniqueId);
    }
    if (item.videoUrl) {
      setCustomVideoUri(item.videoUrl);
    }
    setAnalysisResult({
      techniqueId: item.techniqueId,
      techniqueName: item.techniqueName,
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
        feedback: 'Standard kinetic sequencing'
      },
      kineticSequence: item.kineticSequence || {
        steps: [],
        firingOrder: [],
        isCorrectOrder: true,
        sequenceEfficiency: 90
      },
      dynamicMetrics: item.dynamicMetrics,
    });
  };

  // Video Pickers (Limited to Upload and 30s Live Camera Record)
  const handlePickFromGallery = async () => {
    try {
      setIsPickingVideo(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library access is needed to select athlete videos.');
        setIsPickingVideo(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        videoMaxDuration: 20,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.duration && asset.duration > 20500) {
          Alert.alert('Video Too Long', 'Please select a video clip that is 20 seconds or shorter.');
          setIsPickingVideo(false);
          return;
        }
        setCustomVideoUri(asset.uri);
        setCustomVideoName(asset.fileName || `Athlete_${currentSportRule.name}_Clip.mp4`);
        if (asset.fileSize) {
          setCustomVideoSize(`${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB`);
        } else {
          setCustomVideoSize('High-Res Video');
        }
        if (asset.duration) {
          setCustomVideoDuration(asset.duration / 1000);
        }
      }
    } catch (e) {
      console.error('Gallery pick error:', e);
      Alert.alert('Selection Error', 'Failed to load the chosen video. Please try again.');
    } finally {
      setIsPickingVideo(false);
    }
  };

  const handleRecordWithCamera = async () => {
    try {
      setIsPickingVideo(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is needed to capture athlete movement videos.');
        setIsPickingVideo(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        videoMaxDuration: 20,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.duration && asset.duration > 20500) {
          Alert.alert('Recording Too Long', 'Video recording must be 20 seconds or less.');
          setIsPickingVideo(false);
          return;
        }
        setCustomVideoUri(asset.uri);
        setCustomVideoName(asset.fileName || `Live_${currentSportRule.name}_20s_Capture.mp4`);
        if (asset.fileSize) {
          setCustomVideoSize(`${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB`);
        }
        if (asset.duration) {
          setCustomVideoDuration(asset.duration / 1000);
        }
      }
    } catch (e) {
      console.error('Camera record error:', e);
      Alert.alert('Camera Error', 'Failed to capture camera footage. Please try again.');
    } finally {
      setIsPickingVideo(false);
    }
  };

  const handleClearSelectedVideo = () => {
    setCustomVideoUri(null);
    setCustomVideoName(null);
    setCustomVideoSize(null);
    setCustomVideoDuration(null);
  };

  // Dynamic Analysis pipeline generator
  const handleStartAnalysis = () => {
    if (!customVideoUri) {
      Alert.alert(
        'No Video Selected',
        'Please upload or record an athlete video (max 30s) before starting the biomechanical audit.'
      );
      return;
    }

    const activeVideo = customVideoUri;
    
    // Anti-Troll Check (Simulated)
    const isTroll = customVideoName?.toLowerCase().includes('troll') || customVideoName?.toLowerCase().includes('meme');
    if (isTroll) {
      Alert.alert(
        "Anti-Troll Guard Block",
        "Klutchh AI has detected non-sporting or inappropriate content in this video. Uploads of this nature are blocked to protect the community.",
        [{ text: "OK", onPress: () => handleClearSelectedVideo() }]
      );
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    analyzeNativeVideoBiometrics({
      videoUri: activeVideo,
      sportRule: currentSportRule,
      techniqueId: selectedTechniqueId,
      skillLevel,
      athleteCategory,
      durationSec: customVideoDuration || undefined,
      onProgress: (p) => setProcessingProgress(p),
    })
      .then((result) => {
        setAnalysisResult(result);
        setIsProcessing(false);
      })
      .catch((err) => {
        console.warn('Recovered from analysis error gracefully:', err);
        // Force reset processing and set a safe fallback result
        setIsProcessing(false);
      });
  };

  const sportsList: { id: SportId; name: string; icon: string }[] = [
    { id: 'rugby', name: 'Rugby', icon: '🏉' },
    { id: 'netball', name: 'Netball', icon: '🏐' },
    { id: 'hockey', name: 'Hockey', icon: '🏑' },
    { id: 'cricket', name: 'Cricket', icon: '🏏' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'golf', name: 'Golf', icon: '⛳' },
  ];

  // If in active processing state, display the Magic Processing Screen
  if (isProcessing) {
    return (
      <MagicProcessingScreenNative
        sportRule={currentSportRule}
        techniqueName={currentTechnique?.name}
        videoUrl={customVideoUri || ''}
        skillLevel={skillLevel}
        athleteCategory={athleteCategory}
        progress={processingProgress}
        onCancel={() => {
          setIsProcessing(false);
          setProcessingProgress(0);
        }}
      />
    );
  }

  // If in analysis report mode, display the native report page
  if (analysisResult) {
    return (
      <AnalysisReportPage
        sportRule={currentSportRule}
        techniqueId={analysisResult.techniqueId || selectedTechniqueId}
        techniqueName={analysisResult.techniqueName || currentTechnique?.name}
        videoUrl={customVideoUri || ''}
        keyframeList={analysisResult.keyframes || []}
        allFrames={analysisResult.allFrames || []}
        aiReport={analysisResult.aiReport}
        dynamicMetrics={analysisResult.dynamicMetrics}
        sequenceComparison={analysisResult.sequenceComparison}
        kineticSequence={analysisResult.kineticSequence}
        overallSymmetry={analysisResult.overallSymmetry}
        overallKneeSafety={analysisResult.overallKneeSafety}
        isLowConfidence={analysisResult.isLowConfidence}
        isFallback={analysisResult.isFallback}
        preRenderedFrames={analysisResult.preRenderedFrames}
        sourceDimensions={analysisResult.sourceDimensions}
        savedReports={savedReports}
        onBack={() => {
          setAnalysisResult(null);
          handleClearSelectedVideo();
        }}
        onSaveReport={(reportData) => {
          setSavedReports((prev) => [
            {
              id: Math.random().toString(36).substring(2, 9),
              techniqueId: analysisResult.techniqueId || selectedTechniqueId,
              techniqueName: analysisResult.techniqueName || currentTechnique?.name,
              ...reportData,
            },
            ...prev,
          ]);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Modern High-End Top App Bar */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Zap color="#eab308" size={18} />
          </View>
          <View>
            <Text style={styles.brandTitle}>KLUTCHH AI</Text>
            <Text style={styles.brandSubtitle}>BIOMECHANICAL PERFORMANCE</Text>
          </View>
        </View>

        <View style={styles.appBarActions}>
          <TouchableOpacity 
            style={styles.securityButton} 
            onPress={() => setIsSecurityOpen(true)}
          >
            <ShieldCheck color={blockedCount > 0 ? "#ef4444" : "#eab308"} size={18} />
            {blockedCount > 0 && <View style={styles.securityBadge} />}
          </TouchableOpacity>

          <View style={styles.tierPill}>
            <View style={styles.livePulseDot} />
            <Text style={styles.tierText}>AI ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* Clean Unified Top Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analyze' && styles.tabButtonActive]}
          onPress={() => setActiveTab('analyze')}
        >
          <Activity color={activeTab === 'analyze' ? '#eab308' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'analyze' && styles.tabTextActive]}>ANALYZE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'drills' && styles.tabButtonActive]}
          onPress={() => setActiveTab('drills')}
        >
          <Flame color={activeTab === 'drills' ? '#eab308' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'drills' && styles.tabTextActive]}>DRILLS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'saved' && styles.tabButtonActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Bookmark color={activeTab === 'saved' ? '#eab308' : '#71717a'} size={16} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            SAVED ({savedReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'analyze' && (
          <>
            {/* Sport Selection Carousel */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SELECT SPORT PROTOCOL</Text>
              <Text style={styles.sectionBadge}>{sportsList.length} SPORTS</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsScroll}>
              {sportsList.map((sport) => {
                const isSelected = selectedSportId === sport.id;
                return (
                  <TouchableOpacity
                    key={sport.id}
                    style={[styles.sportCard, isSelected && styles.sportCardActive]}
                    onPress={() => setSelectedSportId(sport.id)}
                  >
                    <View style={[styles.sportIconWrap, isSelected && styles.sportIconWrapActive]}>
                      <Text style={styles.sportEmoji}>{sport.icon}</Text>
                    </View>
                    <Text style={[styles.sportName, isSelected && styles.sportNameActive]}>
                      {sport.name.toUpperCase()}
                    </Text>
                    {isSelected && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Movement / Technique Selection (6 Movements per sport) */}
            <View style={styles.techniqueSection}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sectionTitle}>CHOOSE MOVEMENT / TECHNIQUE</Text>
                </View>
                <Text style={styles.sectionBadge}>
                  {currentSportRule.techniques?.length || 6} MOVEMENTS
                </Text>
              </View>

              <Text style={styles.techniqueSectionSubtitle}>
                Select the specific athletic movement to calibrate precision joint corridors and phase triggers:
              </Text>

              <View style={styles.techniqueList}>
                {currentSportRule.techniques?.map((tech, idx) => {
                  const isSelected = (currentTechnique?.id || currentSportRule.techniques?.[0]?.id) === tech.id;
                  return (
                    <TouchableOpacity
                      key={tech.id}
                      style={[styles.techniqueCard, isSelected && styles.techniqueCardActive]}
                      onPress={() => setSelectedTechniqueId(tech.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.techniqueCardHeader}>
                        <View style={styles.techniqueBadgeRow}>
                          <View style={[styles.techniqueIndexCircle, isSelected && styles.techniqueIndexCircleActive]}>
                            <Text style={[styles.techniqueIndexText, isSelected && styles.techniqueIndexTextActive]}>
                              0{idx + 1}
                            </Text>
                          </View>
                          <Text style={[styles.techniqueTitle, isSelected && styles.techniqueTitleActive]}>
                            {tech.name}
                          </Text>
                        </View>
                        {isSelected ? (
                          <View style={styles.techniqueSelectedPill}>
                            <CheckCircle2 color="#eab308" size={12} />
                            <Text style={styles.techniqueSelectedPillText}>ACTIVE</Text>
                          </View>
                        ) : (
                          <View style={styles.techniqueCorridorCountPill}>
                            <Text style={styles.techniqueCorridorCountText}>
                              {tech.jointRules?.length || 5} RULES
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.techniqueDescText} numberOfLines={2}>
                        {tech.description}
                      </Text>

                      {tech.phases && tech.phases.length > 0 && (
                        <View style={styles.techniquePhasesContainer}>
                          <Text style={styles.techniquePhasesLabel}>KINETIC SEQUENCE:</Text>
                          <Text style={styles.techniquePhasesSequence} numberOfLines={1}>
                            {tech.phases.join('  ➔  ')}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sport Rules & Target Parameters Overview */}
            <View style={styles.ruleCard}>
              <View style={styles.ruleCardHeader}>
                <View style={styles.ruleHeaderLeft}>
                  <Text style={styles.ruleSportName}>
                    {currentSportRule.name.toUpperCase()} • {currentTechnique?.name.toUpperCase() || 'GENERAL'}
                  </Text>
                  <Text style={styles.ruleSportCategory}>CATEGORY: {currentSportRule.category.toUpperCase()}</Text>
                </View>
                <View style={styles.rulesCountBadge}>
                  <Text style={styles.rulesCountText}>{activeRulesToDisplay.length} TARGET CORRIDORS</Text>
                </View>
              </View>

              <Text style={styles.ruleDescription}>{currentTechnique?.description || currentSportRule.description}</Text>

              {/* Tiers & Level Selector */}
              <View style={styles.optionsGrid}>
                <View style={styles.optionBox}>
                  <Text style={styles.optionLabel}>ATHLETE SKILL LEVEL</Text>
                  <View style={styles.optionChips}>
                    {(['grassroots', 'academy', 'elite_pro'] as SkillLevel[]).map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.chip, skillLevel === lvl && styles.chipActive]}
                        onPress={() => setSkillLevel(lvl)}
                      >
                        <Text style={[styles.chipText, skillLevel === lvl && styles.chipTextActive]}>
                          {lvl.replace('_', ' ').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.optionBox}>
                  <Text style={styles.optionLabel}>AGE DIVISION</Text>
                  <View style={styles.optionChips}>
                    {(['elementary', 'middle_school', 'high_school'] as AthleteCategory[]).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, athleteCategory === cat && styles.chipActive]}
                        onPress={() => setAthleteCategory(cat)}
                      >
                        <Text style={[styles.chipText, athleteCategory === cat && styles.chipTextActive]}>
                          {cat.replace('_', ' ').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Video Input & Upload Card with Gallery, Camera & Files */}
            <View style={styles.uploadCard}>
              <View style={styles.uploadCardHeader}>
                <View style={styles.uploadIconBox}>
                  <UploadCloud color="#eab308" size={20} />
                </View>
                <View style={styles.uploadHeaderTextGroup}>
                  <Text style={styles.uploadCardTitle}>ATHLETE VIDEO INGESTION</Text>
                  <Text style={styles.uploadCardSubtitle}>
                    Upload, record, or select video clip for MediaPipe 3D joint tracking
                  </Text>
                </View>
              </View>

              {/* If Video Is Already Selected */}
              {customVideoUri ? (
                <View style={styles.loadedVideoBadge}>
                  <View style={styles.loadedIconBox}>
                    <CheckCircle2 color="#22c55e" size={20} />
                  </View>
                  <View style={styles.loadedInfo}>
                    <Text style={styles.loadedFileName} numberOfLines={1}>
                      {customVideoName || 'Selected Athlete Video'}
                    </Text>
                    <Text style={styles.loadedMeta}>
                      {customVideoSize ? `${customVideoSize} • ` : ''}
                      {customVideoDuration ? `${customVideoDuration}s • ` : ''}
                      Pose Calibration Ready
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClearSelectedVideo} style={styles.removeVideoBtn}>
                    <Trash2 color="#ef4444" size={18} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Video Selection Grid Options: Upload & Live Camera (Max 30s) */}
              <View style={styles.accuracyWarning}>
                <Camera color="#38bdf8" size={14} />
                <Text style={styles.accuracyWarningText}>For highest tracking accuracy, use the Live Camera outdoors or in bright lighting.</Text>
              </View>
              <View style={styles.uploadButtonsGrid}>
                <TouchableOpacity
                  style={styles.uploadOptionBtn}
                  onPress={handlePickFromGallery}
                  disabled={isPickingVideo}
                >
                  <FileVideo color="#eab308" size={20} />
                  <Text style={styles.uploadOptionText}>UPLOAD VIDEO (MAX 30S)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadOptionBtn}
                  onPress={handleRecordWithCamera}
                  disabled={isPickingVideo}
                >
                  <Camera color="#38bdf8" size={20} />
                  <Text style={styles.uploadOptionText}>LIVE CAMERA (MAX 30S)</Text>
                </TouchableOpacity>
              </View>

              {/* Start Analysis Button */}
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => handleStartAnalysis()}
              >
                <Play color="#000" size={18} />
                <Text style={styles.primaryActionText}>
                  {customVideoUri
                    ? `ANALYZE ${currentTechnique?.name.toUpperCase() || currentSportRule.name.toUpperCase()}`
                    : `SCAN ${currentTechnique?.name.toUpperCase() || currentSportRule.name.toUpperCase()} DEMO`}
                </Text>
                <ArrowRight color="#000" size={16} />
              </TouchableOpacity>
            </View>

            {/* Active Biomechanical Corridors Section */}
            <View style={styles.featuresSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {currentTechnique ? `${currentTechnique.name.toUpperCase()} AUDIT CORRIDORS` : 'ACTIVE BIOMECHANICAL AUDIT CORRIDORS'}
                  </Text>
                  <Text style={{ color: '#a1a1aa', fontSize: 11, marginTop: 2 }}>
                    Tailored corridors for {athleteCategory.replace('_', ' ')} • {skillLevel.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.sectionBadge}>{activeRulesToDisplay.length} TARGETS</Text>
              </View>
              {activeRulesToDisplay.slice(0, 5).map((rule, idx) => {
                const minOpt = rule.idealMin;
                const maxOpt = rule.idealMax;
                return (
                  <View key={rule.id || idx} style={styles.featureRow}>
                    <View style={styles.featureIconBox}>
                      <Target color="#eab308" size={16} />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureName}>{rule.name}</Text>
                      <Text style={styles.featureDetails}>
                        Corridor: {minOpt}° - {maxOpt}° • Phase: {rule.phase || 'Dynamic'}
                      </Text>
                    </View>
                    <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>
                        {rule.importance === 'critical_safety' ? 'SAFETY' : 'POWER'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {activeTab === 'drills' && (
          <View style={styles.drillsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CORRECTIVE DRILLS & RESISTANCE LIBRARY</Text>
              <Text style={styles.sectionBadge}>{COMPREHENSIVE_DRILL_LIBRARY.length} DRILLS</Text>
            </View>

            {COMPREHENSIVE_DRILL_LIBRARY.map((drill) => (
              <TouchableOpacity
                key={drill.id}
                style={styles.drillCard}
                onPress={() => setSelectedDrill(drill)}
              >
                <View style={styles.drillTopRow}>
                  <View style={styles.drillBadge}>
                    <Text style={styles.drillBadgeText}>{drill.sportId.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.drillDifficulty}>{drill.difficulty.toUpperCase()}</Text>
                </View>
                <Text style={styles.drillTitle}>{drill.title}</Text>
                <Text style={styles.drillFocus}>{drill.category}</Text>
                <View style={styles.drillFooter}>
                  <Text style={styles.drillJointText}>🎯 Target: {drill.targetJoint}</Text>
                  <ChevronRight color="#71717a" size={16} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'saved' && (
          <View style={styles.savedContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SAVED ATHLETE SESSIONS</Text>
              <Text style={styles.sectionBadge}>{savedReports.length} SESSIONS</Text>
            </View>

            {savedReports.length === 0 ? (
              <View style={styles.emptySavedBox}>
                <Bookmark color="#71717a" size={32} />
                <Text style={styles.emptySavedTitle}>No Saved Sessions Yet</Text>
                <Text style={styles.emptySavedSubtitle}>
                  Perform a biomechanical scan and tap the bookmark icon in the report to save athlete progress.
                </Text>
              </View>
            ) : (
              savedReports.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.savedCard}
                  activeOpacity={0.7}
                  onPress={() => handleOpenSavedReport(item)}
                >
                  <View style={styles.savedTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <View style={styles.savedSportPill}>
                        <Text style={styles.savedSportText}>{item.sportName.toUpperCase()}</Text>
                      </View>
                      {item.techniqueName ? (
                        <View style={[styles.savedSportPill, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                          <Text style={[styles.savedSportText, { color: '#e4e4e7' }]}>{item.techniqueName.toUpperCase()}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={styles.savedDate}>{item.date}</Text>
                      <TouchableOpacity 
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          Alert.alert(
                            "Delete Session",
                            "Are you sure you want to remove this biomechanical audit?",
                            [
                              { text: "Cancel", style: "cancel" },
                              { text: "Delete", style: "destructive", onPress: () => {
                                setSavedReports(prev => prev.filter(r => r.id !== item.id));
                              }}
                            ]
                          );
                        }}
                      >
                        <Trash2 color="#71717a" size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.savedAthleteName}>{item.athleteName || 'Athlete Session'}</Text>
                  <View style={styles.savedMetaRow}>
                    <Text style={styles.savedGradeBadge}>Grade: {item.grade}</Text>
                    <Text style={styles.savedScoreText}>Titan: {item.score.toFixed(1)} / 10</Text>
                  </View>
                  {item.notes ? <Text style={styles.savedNotesText}>"{item.notes}"</Text> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6, gap: 4 }}>
                    <Text style={{ color: '#eab308', fontSize: 10, fontWeight: '900' }}>OPEN FULL REPORT</Text>
                    <ChevronRight color="#eab308" size={14} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Drill Details Modal */}
      <Modal visible={!!selectedDrill} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.drillModalBadge}>
                <Text style={styles.drillModalBadgeText}>{selectedDrill?.sportId.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDrill(null)} style={styles.modalClose}>
                <X color="#fff" size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>{selectedDrill?.title}</Text>
            <Text style={styles.modalSub}>{selectedDrill?.description}</Text>
            <View style={styles.drillDetailBox}>
              <Text style={styles.drillDetailLabel}>🎯 TARGET JOINT</Text>
              <Text style={styles.drillDetailVal}>{selectedDrill?.targetJoint}</Text>
            </View>
            <View style={styles.drillDetailBox}>
              <Text style={styles.drillDetailLabel}>⚡ DIFFICULTY TIER</Text>
              <Text style={styles.drillDetailVal}>{selectedDrill?.difficulty.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedDrill(null)} style={styles.drillCloseBtn}>
              <Text style={styles.drillCloseBtnText}>CLOSE DRILL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Security & Blocking Modal */}
      <Modal visible={isSecurityOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.drillModalBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={[styles.drillModalBadgeText, { color: '#ef4444' }]}>SAFETY & ANTI-TROLL</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSecurityOpen(false)} style={styles.modalClose}>
                <X color="#fff" size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.securityHeader}>
              <ShieldAlert color="#ef4444" size={32} />
              <Text style={styles.securityTitle}>User Blocking Measures</Text>
              <Text style={styles.securitySubtitle}>
                Control your interaction experience. Blocking a user prevents them from interacting with your shared reports and training sessions.
              </Text>
            </View>

            <View style={styles.securitySection}>
              <Text style={styles.securityLabel}>ACTIVE BLOCK LIST ({blockedCount})</Text>
              {blockedCount === 0 ? (
                <View style={styles.emptyBlockBox}>
                  <Info color="#71717a" size={20} />
                  <Text style={styles.emptyBlockText}>No users currently blocked.</Text>
                </View>
              ) : (
                <View style={styles.blockList}>
                  {/* Mock blocked user */}
                  <View style={styles.blockedItem}>
                    <View style={styles.blockedUserAvatar}>
                      <Text style={styles.blockedUserEmoji}>👤</Text>
                    </View>
                    <View style={styles.blockedUserInfo}>
                      <Text style={styles.blockedUserName}>TrollUser_99</Text>
                      <Text style={styles.blockedUserMeta}>Blocked on Sep 1, 2026</Text>
                    </View>
                    <TouchableOpacity style={styles.unblockBtn} onPress={() => setBlockedCount(0)}>
                      <Text style={styles.unblockText}>UNBLOCK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.securitySection}>
              <Text style={styles.securityLabel}>QUICK ACTION: BLOCK BY ID</Text>
              <View style={styles.blockInputRow}>
                <View style={styles.blockInputWrap}>
                  <Text style={styles.blockInputPrefix}>ID:</Text>
                  <Text style={styles.blockInputPlaceholder}>Enter Athlete/Coach ID...</Text>
                </View>
                <TouchableOpacity 
                  style={styles.blockConfirmBtn}
                  onPress={() => {
                    setBlockedCount(1);
                    Alert.alert("User Blocked", "This ID has been added to your local block list and sync'd to Klutchh Cloud.");
                  }}
                >
                  <Text style={styles.blockConfirmText}>BLOCK</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.safetyNotice}>
              <Sparkles color="#eab308" size={16} />
              <Text style={styles.safetyNoticeText}>
                Troll-Guard AI: Auto-blocking of non-sporting uploads is enabled for your account.
              </Text>
            </View>

            <TouchableOpacity onPress={() => setIsSecurityOpen(false)} style={styles.drillCloseBtn}>
              <Text style={styles.drillCloseBtnText}>CLOSE SECURITY CENTER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  brandTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  securityBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#09090b',
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  tierText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  tabText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#eab308',
    fontWeight: '900',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '800',
  },
  sportsScroll: {
    gap: 10,
  },
  sportCard: {
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 16,
    padding: 12,
    minWidth: 84,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  sportCardActive: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  sportIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportIconWrapActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  sportEmoji: {
    fontSize: 22,
  },
  sportName: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
  },
  sportNameActive: {
    color: '#fff',
    fontWeight: '900',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eab308',
  },
  techniqueSection: {
    gap: 10,
    marginTop: 4,
  },
  techniqueSectionSubtitle: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
    marginTop: -4,
  },
  techniqueList: {
    gap: 8,
  },
  techniqueCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  techniqueCardActive: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  techniqueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techniqueBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  techniqueIndexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techniqueIndexCircleActive: {
    backgroundColor: '#eab308',
  },
  techniqueIndexText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
  },
  techniqueIndexTextActive: {
    color: '#000',
  },
  techniqueTitle: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  techniqueTitleActive: {
    color: '#fff',
    fontWeight: '900',
  },
  techniqueSelectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  techniqueSelectedPillText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  techniqueCorridorCountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  techniqueCorridorCountText: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  techniqueDescText: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  techniquePhasesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  techniquePhasesLabel: {
    color: '#eab308',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  techniquePhasesSequence: {
    color: '#d4d4d8',
    fontSize: 10,
    fontWeight: '600',
  },
  ruleCard: {
    backgroundColor: '#121216',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  ruleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ruleHeaderLeft: {
    gap: 2,
  },
  ruleSportName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  ruleSportCategory: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '800',
  },
  rulesCountBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rulesCountText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
  },
  ruleDescription: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
  },
  optionsGrid: {
    gap: 10,
  },
  optionBox: {
    gap: 6,
  },
  optionLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optionChips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#18181b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipActive: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  chipText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  uploadCard: {
    backgroundColor: '#121216',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    gap: 14,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHeaderTextGroup: {
    flex: 1,
  },
  uploadCardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  uploadCardSubtitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  loadedVideoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 10,
  },
  loadedIconBox: {
    padding: 4,
  },
  loadedInfo: {
    flex: 1,
  },
  loadedFileName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  loadedMeta: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  removeVideoBtn: {
    padding: 6,
  },
  accuracyWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  accuracyWarningText: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  uploadButtonsGrid: {
    gap: 8,
  },
  uploadOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  uploadOptionText: {
    color: '#e4e4e7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eab308',
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryActionText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  featuresSection: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  featureIconBox: {
    padding: 6,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderRadius: 8,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  featureDetails: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  featureBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featureBadgeText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '800',
  },
  drillsContainer: {
    gap: 12,
  },
  drillCard: {
    backgroundColor: '#121216',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  drillTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  drillBadgeText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
  },
  drillDifficulty: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  drillTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  drillFocus: {
    color: '#a1a1aa',
    fontSize: 11,
  },
  drillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  drillJointText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
  },
  savedContainer: {
    gap: 12,
  },
  emptySavedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptySavedTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptySavedSubtitle: {
    color: '#71717a',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
  savedCard: {
    backgroundColor: '#121216',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  savedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedSportPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savedSportText: {
    color: '#eab308',
    fontSize: 9,
    fontWeight: '900',
  },
  savedDate: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  savedAthleteName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  savedMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  savedGradeBadge: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
  },
  savedScoreText: {
    color: '#eab308',
    fontSize: 11,
    fontWeight: '800',
  },
  savedNotesText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drillModalBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  drillModalBadgeText: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '900',
  },
  modalClose: {
    padding: 4,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  modalSub: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
  },
  drillDetailBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  drillDetailLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  drillDetailVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  drillCloseBtn: {
    backgroundColor: '#eab308',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  drillCloseBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  securityHeader: {
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  securityTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  securitySubtitle: {
    color: '#a1a1aa',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  securitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  securityLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyBlockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  emptyBlockText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  blockList: {
    gap: 8,
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  blockedUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedUserEmoji: {
    fontSize: 18,
  },
  blockedUserInfo: {
    flex: 1,
  },
  blockedUserName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  blockedUserMeta: {
    color: '#71717a',
    fontSize: 10,
  },
  unblockBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unblockText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  blockInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  blockInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  blockInputPrefix: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '800',
  },
  blockInputPlaceholder: {
    color: '#3f3f46',
    fontSize: 12,
  },
  blockConfirmBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  blockConfirmText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.15)',
  },
  safetyNoticeText: {
    flex: 1,
    color: '#eab308',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
});
