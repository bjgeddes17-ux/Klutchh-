import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { SavedReport, UserAccount, TrophyCard } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { checkAndExecuteLongitudinalEngine, LongitudinalAnalysisResult } from '../utils/longitudinalEngine';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Activity, 
  ChevronLeft,
  Filter,
  Download,
  Zap,
  Dna,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trophy,
  Trash2,
  Flame,
  FlipHorizontal,
  RefreshCw,
  Award
} from 'lucide-react';

interface ProgressDashboardProps {
  reports: SavedReport[];
  onBack: () => void;
  onUpdateDrillProgress?: (reportId: string, progress: Record<number, 'pending' | 'completed' | 'mastered'>) => void;
  onSelectReport?: (report: SavedReport) => void;
  currentUser: UserAccount | null;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ 
  reports, 
  onBack,
  onUpdateDrillProgress,
  onSelectReport,
  currentUser
}) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const radarRef = useRef<SVGSVGElement>(null);
  
  // Sort reports chronologically
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [reports]);

  const latestReport = sortedReports[sortedReports.length - 1];
  const firstReport = sortedReports[0];
  const improvement = latestReport && firstReport 
    ? latestReport.overallScore - firstReport.overallScore 
    : 0;

  // 14-Day Auto-Recalibration Longitudinal Engine
  const longitudinalResult = useMemo(() => {
    if (!latestReport) return null;
    return checkAndExecuteLongitudinalEngine(
      latestReport.keyframeList || [],
      { name: latestReport.sportName, phases: ['Setup', 'Load', 'Plant', 'Impact'], techniques: [] } as any,
      latestReport.overallScore
    );
  }, [latestReport]);

  // Global Drill Mastery Stats
  const drillStats = useMemo(() => {
    let masteredCount = 0;
    let completedCount = 0;
    let totalCount = 0;

    reports.forEach((r) => {
      const dp = r.drillProgress || {};
      const drills = r.report?.funCorrectiveDrills || [];
      const len = Math.max(drills.length, 3);
      totalCount += len;

      Object.values(dp).forEach((status) => {
        if (status === 'mastered') masteredCount++;
        else if (status === 'completed') completedCount++;
      });
    });

    const masteryRate = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

    return { masteredCount, completedCount, totalCount, masteryRate };
  }, [reports]);

  // Radar Data Calculation
  const radarData = useMemo(() => {
    if (!latestReport) return null;

    let totalOptimal = 0;
    let totalChecked = 0;
    latestReport.keyframeList.forEach(frame => {
      Object.values(frame.ruleResults).forEach(res => {
        totalChecked++;
        if (res === 'optimal') totalOptimal++;
        else if (res === 'good') totalOptimal += 0.8;
      });
    });
    const technicalPrecision = totalChecked > 0 ? (totalOptimal / totalChecked) * 100 : 80;
    const explosiveness = latestReport.dynamicMetrics?.explosivenessScore || 70;
    const symmetry = latestReport.symmetryScore;

    const riskScore = latestReport.report.injuryRiskAssessment.level === 'low' ? 100 : 
                     latestReport.report.injuryRiskAssessment.level === 'moderate' ? 60 : 30;
    const injuryPrevention = (latestReport.kneeSafetyScore + riskScore) / 2;
    const stability = technicalPrecision * 0.95;

    return [
      { axis: "Technical Precision", value: technicalPrecision, benchmark: 95 },
      { axis: "Explosiveness", value: explosiveness, benchmark: 90 },
      { axis: "Symmetry", value: symmetry, benchmark: 98 },
      { axis: "Injury Prevention", value: injuryPrevention, benchmark: 100 },
      { axis: "Stability", value: stability, benchmark: 92 }
    ];
  }, [latestReport]);

  // D3 Line Chart with Drill Mastery Trend & Real-time Nodes
  useEffect(() => {
    if (!chartRef.current || sortedReports.length === 0) return;

    const margin = { top: 45, right: 35, bottom: 55, left: 50 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 340 - margin.top - margin.bottom;

    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3.select(chartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Domain calculation (support 1 or multiple reports)
    let xDomain: [Date, Date];
    if (sortedReports.length === 1) {
      const singleDate = new Date(sortedReports[0].createdAt);
      xDomain = [
        new Date(singleDate.getTime() - 86400000 * 2),
        new Date(singleDate.getTime() + 86400000 * 2)
      ];
    } else {
      xDomain = d3.extent(sortedReports, (d: SavedReport) => new Date(d.createdAt)) as [Date, Date];
    }

    const x = d3.scaleTime().domain(xDomain).range([0, width]);
    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    // Grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#27272a")
      .attr("stroke-opacity", 0.6)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""));

    // X Axis
    const xAxis = d3.axisBottom(x)
      .ticks(Math.min(sortedReports.length + 2, 6))
      .tickFormat(d3.timeFormat("%b %d") as any);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .attr("color", "#71717a")
      .selectAll("text")
      .style("font-size", "10px")
      .style("font-weight", "bold");

    // Y Axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#71717a")
      .selectAll("text")
      .style("font-size", "10px")
      .style("font-weight", "bold");

    // Defs for gradients
    const defs = svg.append("defs");

    const lineGradient = defs.append("linearGradient")
      .attr("id", "score-line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", y(0))
      .attr("x2", 0).attr("y2", y(10));

    lineGradient.append("stop").attr("offset", "0%").attr("stop-color", "#ef4444");
    lineGradient.append("stop").attr("offset", "50%").attr("stop-color", "#f59e0b");
    lineGradient.append("stop").attr("offset", "100%").attr("stop-color", "#10b981");

    // 1. Overall Score Line
    if (sortedReports.length > 1) {
      const lineScore = d3.line<SavedReport>()
        .x((d: SavedReport) => x(new Date(d.createdAt)))
        .y((d: SavedReport) => y(d.overallScore))
        .curve(d3.curveMonotoneX);

      svg.append("path")
        .datum(sortedReports)
        .attr("fill", "none")
        .attr("stroke", "url(#score-line-gradient)")
        .attr("stroke-width", 3.5)
        .attr("d", lineScore);

      // 2. Drill Mastery Trend Line (Dashed Cyan/Emerald)
      const lineMastery = d3.line<SavedReport>()
        .x((d: SavedReport) => x(new Date(d.createdAt)))
        .y((d: SavedReport) => {
          const dp = d.drillProgress || {};
          const mastered = Object.values(dp).filter(s => s === 'mastered').length;
          const total = d.report?.funCorrectiveDrills?.length || 3;
          const score = (mastered / Math.max(1, total)) * 10;
          return y(score);
        })
        .curve(d3.curveMonotoneX);

      svg.append("path")
        .datum(sortedReports)
        .attr("fill", "none")
        .attr("stroke", "#06b6d4")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "5,5")
        .attr("d", lineMastery);
    }

    // 3. Render Nodes for Overall Score
    svg.selectAll(".dot-score")
      .data(sortedReports)
      .enter().append("circle")
      .attr("class", "dot-score")
      .attr("cx", (d: SavedReport) => x(new Date(d.createdAt)))
      .attr("cy", (d: SavedReport) => y(d.overallScore))
      .attr("r", 6)
      .attr("fill", "#09090b")
      .attr("stroke", (d: SavedReport) => d.overallScore >= 9 ? "#10b981" : d.overallScore >= 8 ? "#f59e0b" : "#ef4444")
      .attr("stroke-width", 3.5);

    // 4. Render Nodes for Drill Mastery Level
    svg.selectAll(".dot-mastery")
      .data(sortedReports)
      .enter().append("circle")
      .attr("class", "dot-mastery")
      .attr("cx", (d: SavedReport) => x(new Date(d.createdAt)))
      .attr("cy", (d: SavedReport) => {
        const dp = d.drillProgress || {};
        const mastered = Object.values(dp).filter(s => s === 'mastered').length;
        const total = d.report?.funCorrectiveDrills?.length || 3;
        return y((mastered / Math.max(1, total)) * 10);
      })
      .attr("r", 4.5)
      .attr("fill", "#06b6d4")
      .attr("stroke", "#083344")
      .attr("stroke-width", 2);

    // 5. Render Mastered Drill Star Badges directly over report points
    sortedReports.forEach((d) => {
      const dp = d.drillProgress || {};
      const mastered = Object.values(dp).filter(s => s === 'mastered').length;
      const total = d.report?.funCorrectiveDrills?.length || 3;
      const cx = x(new Date(d.createdAt));
      const cy = y(d.overallScore);

      if (mastered > 0) {
        // Glowing ring
        svg.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 12)
          .attr("fill", "none")
          .attr("stroke", "#34d399")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "3,2")
          .attr("opacity", 0.9);

        // Star label badge above point
        svg.append("rect")
          .attr("x", cx - 36)
          .attr("y", cy - 24)
          .attr("width", 72)
          .attr("height", 16)
          .attr("rx", 4)
          .attr("fill", "#022c22")
          .attr("stroke", "#059669")
          .attr("stroke-width", 1);

        svg.append("text")
          .attr("x", cx)
          .attr("y", cy - 13)
          .attr("text-anchor", "middle")
          .style("font-size", "8.5px")
          .style("font-weight", "900")
          .style("fill", "#6ee7b7")
          .text(`★ ${mastered}/${total} MASTERED`);
      }
    });

  }, [sortedReports]);

  // Radar Chart Effect
  useEffect(() => {
    if (!radarRef.current || !radarData) return;

    const width = radarRef.current.clientWidth;
    const height = 340;
    const radius = Math.min(width, height) / 2 - 55;
    const center = { x: width / 2, y: height / 2 };

    d3.select(radarRef.current).selectAll("*").remove();

    const svg = d3.select(radarRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${center.x},${center.y})`);

    const angleSlice = (Math.PI * 2) / radarData.length;

    // Draw grid circles
    const levels = 5;
    for (let j = 0; j < levels; j++) {
      const levelFactor = radius * ((j + 1) / levels);
      svg.selectAll(".grid-circle")
        .data(radarData)
        .enter().append("line")
        .attr("x1", (d, i) => levelFactor * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y1", (d, i) => levelFactor * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("x2", (d, i) => levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
        .attr("y2", (d, i) => levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
        .attr("stroke", "#27272a")
        .attr("stroke-width", "1px");
    }

    // Axis lines
    const axis = svg.selectAll(".axis")
      .data(radarData)
      .enter().append("g")
      .attr("class", "axis");

    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "#27272a")
      .attr("stroke-width", "1px");

    axis.append("text")
      .attr("class", "legend")
      .style("font-size", "9px")
      .style("font-weight", "black")
      .style("fill", "#a1a1aa")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => (d as any).axis.toUpperCase());

    const radarLine = d3.lineRadial<any>()
      .radius(d => (d.value / 100) * radius)
      .angle((d, i) => i * angleSlice);

    const benchmarkLine = d3.lineRadial<any>()
      .radius(d => (d.benchmark / 100) * radius)
      .angle((d, i) => i * angleSlice);

    // Benchmark Area
    svg.append("path")
      .datum(radarData)
      .attr("d", benchmarkLine as any)
      .attr("fill", "#ef4444")
      .attr("fill-opacity", 0.05)
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    // Athlete Area
    svg.append("path")
      .datum(radarData)
      .attr("d", radarLine as any)
      .attr("fill", "#ef4444")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3);

  }, [radarData]);

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <Activity className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-lg font-bold text-white mb-1">No Evaluation Progress Data</h3>
        <p className="text-zinc-500 text-sm mb-6">Complete video analyses to evaluate biomechanical trends and drill mastery.</p>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 sm:p-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group cursor-pointer self-start"
        >
          <div className="p-1.5 rounded-lg bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800">
            <ChevronLeft className="w-4 h-4 text-zinc-300" />
          </div>
          <span className="text-sm font-bold uppercase tracking-tight">Workspace</span>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="hidden sm:flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-mono text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Real-time Sync Active</span>
          </div>
          <button className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center justify-center">
            <Download className="w-4 h-4" />
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-red-900/20 uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>Filter Data</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Improvement */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-1 shadow-lg"
        >
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider">Total Improvement</span>
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-black ${improvement >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}
            </span>
            <span className="text-zinc-500 text-sm font-bold mb-1">pts</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Since first evaluation</p>
        </motion.div>

        {/* Current Score */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-1 shadow-lg"
        >
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-wider">Latest Score</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-white">{latestReport.overallScore.toFixed(1)}</span>
            <span className="text-zinc-500 text-sm font-bold mb-1">/ 10</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-tight">
              Grade {latestReport.overallGrade}
            </span>
          </div>
        </motion.div>

        {/* Drill Mastery Index (Synced Live) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/90 border border-amber-500/30 p-5 rounded-2xl flex flex-col justify-between gap-1 shadow-lg relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Drill Mastery</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-amber-300">{drillStats.masteredCount}</span>
            <span className="text-zinc-400 text-xs font-bold mb-1">/ {drillStats.totalCount} Drills</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, drillStats.masteryRate)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-amber-400 font-bold">{drillStats.masteryRate}%</span>
          </div>
        </motion.div>

        {/* Evaluation Frequency */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-1 shadow-lg"
        >
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-wider">Evaluation Log</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-white">{reports.length}</span>
            <span className="text-zinc-500 text-sm font-bold mb-1">Sessions</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Continuous Biomechanical Audit</p>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Performance & Drill Mastery Trends Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Performance & Drill Mastery Trends
            </h3>
            
            {/* Chart Legend */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-amber-400 rounded-full"></span>
                <span className="text-zinc-300">Biomechanical Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400"></span>
                <span className="text-cyan-300 font-bold">Drill Mastery</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
            <svg ref={chartRef} className="w-full min-w-[500px] sm:min-w-0 h-[320px]"></svg>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Marking drills as <strong>"Mastered"</strong> dynamically updates the cyan trend line & performance nodes.
            </span>
          </div>
        </div>

        {/* Skill Mastery Radar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <Dna className="w-4 h-4 text-purple-400" />
              Biomechanics Radar Profile
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase">Athlete</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-red-500 border-dashed"></span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Gold Target</span>
              </div>
            </div>
          </div>
          <div className="w-full relative">
            <svg ref={radarRef} className="w-full h-[320px]"></svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
              <Zap className="w-32 h-32 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 14-Day Longitudinal Auto-Recalibration Engine Card */}
      {longitudinalResult && (
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-yellow-500/30 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-3.5 rounded-2xl text-yellow-400">
                <RefreshCw className="w-7 h-7 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">14-Day Longitudinal Auto-Recalibration Engine</h3>
                  <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Cycle #{longitudinalResult.currentCycle} Active
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Automated background health checks and biometric recalculation. Next full recalibration in <strong className="text-yellow-400">{longitudinalResult.daysUntilNextCalibration} days</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-zinc-950/80 px-5 py-3 rounded-2xl border border-zinc-800">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Cumulative Delta</span>
                <span className={`text-sm font-mono font-black ${longitudinalResult.progressDeltaScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {longitudinalResult.progressDeltaScore >= 0 ? `+${longitudinalResult.progressDeltaScore}` : longitudinalResult.progressDeltaScore} pts
                </span>
              </div>
              <div className="w-[1px] h-8 bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Velocity Growth</span>
                <span className="text-sm font-mono font-black text-yellow-400">
                  +{longitudinalResult.velocityGrowthRate}%
                </span>
              </div>
              <div className="w-[1px] h-8 bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Milestone</span>
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {longitudinalResult.historyRecords[longitudinalResult.historyRecords.length - 1]?.milestoneUnlocked || 'Active Cycle'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-3">
            {longitudinalResult.activeRecommendations.map((rec, idx) => (
              <div key={idx} className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drill Mastery Matrix & Detailed Session History */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col mb-8">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">
              Prescribed Drills & Session History Matrix
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg">
            {reports.length} Evaluated Sessions
          </span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {sortedReports.slice().reverse().map((report, index) => {
            const dp = report.drillProgress || {};
            const drills = report.report?.funCorrectiveDrills || [
              { name: 'Single-Leg Drop Landings & Knee Tracking', reps: '3 sets x 8 reps' },
              { name: 'Core Bracing & Neutral Spine Box Hold', reps: '3 sets x 12 reps' },
              { name: 'Banded Hip Hinge & Explosive Drive', reps: '3 sets x 10 reps' }
            ];

            const masteredInReport = Object.values(dp).filter(s => s === 'mastered').length;

            return (
              <div key={`${report.id}-${index}`} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-zinc-850/40 transition-colors">
                
                {/* Left: Score & Report Meta */}
                <div className="flex items-center gap-4 shrink-0 min-w-[240px]">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-base font-black shadow-lg ${
                    report.overallScore >= 9 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    report.overallScore >= 8 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    <span>{report.overallScore.toFixed(0)}</span>
                    <span className="text-[8px] opacity-70 font-sans">SCORE</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{report.title}</h4>
                      {masteredInReport > 0 && (
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{masteredInReport} Mastered</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-3">
                      <span className="text-amber-300 font-semibold">{report.sportName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Center: Live Drill Status Toggles Matrix */}
                <div className="flex-1 w-full md:w-auto flex flex-wrap items-center gap-2 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800/80">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider w-full sm:w-auto mr-1">
                    Drill Matrix:
                  </span>

                  {drills.map((drill, idx) => {
                    const status = dp[idx] || 'pending';
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (onUpdateDrillProgress) {
                            const nextStatus = status === 'pending' ? 'completed' : status === 'completed' ? 'mastered' : 'pending';
                            const newDp: Record<number, 'pending' | 'completed' | 'mastered'> = { ...dp, [idx]: nextStatus };
                            onUpdateDrillProgress(report.id, newDp);
                          }
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                          status === 'mastered'
                            ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20'
                            : status === 'completed'
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Click to toggle drill mastery (Pending -> Completed -> Mastered)"
                      >
                        {status === 'mastered' ? (
                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        ) : status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                        )}
                        <span className="truncate max-w-[140px]">{drill.name}</span>
                        <span className="text-[8px] uppercase font-black opacity-80 border-l border-zinc-700/50 pl-1 ml-0.5">
                          {status}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Load Report Button */}
                {onSelectReport && (
                  <button
                    onClick={() => onSelectReport(report)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3 py-2 rounded-xl border border-zinc-700/80 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>View Report</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                )}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ProgressDashboard;
