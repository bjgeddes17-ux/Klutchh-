import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { SavedReport, UserAccount } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Activity, 
  ChevronLeft,
  Filter,
  Zap,
  CheckCircle2,
  ArrowRight
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
  
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [reports]);

  const latestReport = sortedReports[sortedReports.length - 1];
  const firstReport = sortedReports[0];
  const improvement = latestReport && firstReport 
    ? latestReport.overallScore - firstReport.overallScore 
    : 0;

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

  const radarData = useMemo(() => {
    if (!latestReport) return null;
    return [
      { axis: "Precision", value: 85 },
      { axis: "Explosivity", value: latestReport.dynamicMetrics?.explosivenessScore || 70 },
      { axis: "Symmetry", value: latestReport.symmetryScore },
      { axis: "Safety", value: latestReport.kneeSafetyScore },
      { axis: "Stability", value: 80 }
    ];
  }, [latestReport]);

  useEffect(() => {
    if (!chartRef.current || sortedReports.length === 0) return;
    const margin = { top: 30, right: 20, bottom: 40, left: 40 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;
    d3.select(chartRef.current).selectAll("*").remove();
    const svg = d3.select(chartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().domain(d3.extent(sortedReports, (d: SavedReport) => new Date(d.createdAt)) as [Date, Date]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#27272a")
      .attr("stroke-opacity", 0.4)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""));

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d") as any))
      .attr("color", "#71717a")
      .selectAll("text")
      .style("font-size", "10px")
      .style("font-weight", "800");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#71717a")
      .selectAll("text")
      .style("font-size", "10px")
      .style("font-weight", "800");

    if (sortedReports.length > 1) {
      const lineScore = d3.line<SavedReport>()
        .x((d: SavedReport) => x(new Date(d.createdAt)))
        .y((d: SavedReport) => y(d.overallScore))
        .curve(d3.curveMonotoneX);
      svg.append("path")
        .datum(sortedReports)
        .attr("fill", "none")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 3)
        .attr("d", lineScore);
    }

    svg.selectAll(".dot")
      .data(sortedReports)
      .enter().append("circle")
      .attr("cx", (d: SavedReport) => x(new Date(d.createdAt)))
      .attr("cy", (d: SavedReport) => y(d.overallScore))
      .attr("r", 5)
      .attr("fill", "#09090b")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2);
  }, [sortedReports]);

  useEffect(() => {
    if (!radarRef.current || !radarData) return;
    const width = radarRef.current.clientWidth;
    const height = 280;
    const radius = Math.min(width, height) / 2 - 40;
    const center = { x: width / 2, y: height / 2 };
    d3.select(radarRef.current).selectAll("*").remove();
    const svg = d3.select(radarRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${center.x},${center.y})`);

    const angleSlice = (Math.PI * 2) / radarData.length;
    for (let j = 0; j < 5; j++) {
      const levelFactor = radius * ((j + 1) / 5);
      svg.selectAll(".grid-circle")
        .data(radarData)
        .enter().append("line")
        .attr("x1", (d, i) => levelFactor * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y1", (d, i) => levelFactor * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("x2", (d, i) => levelFactor * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
        .attr("y2", (d, i) => levelFactor * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
        .attr("stroke", "#27272a")
        .attr("stroke-opacity", 0.5);
    }

    const axis = svg.selectAll(".axis").data(radarData).enter().append("g");
    axis.append("line")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "#27272a");

    axis.append("text")
      .attr("x", (d, i) => (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("text-anchor", "middle")
      .style("font-size", "9px")
      .style("font-weight", "900")
      .style("fill", "#f59e0b")
      .text(d => d.axis);

    const radarLine = d3.lineRadial<any>()
      .radius(d => (d.value / 100) * radius)
      .angle((d, i) => i * angleSlice);

    svg.append("path")
      .datum(radarData)
      .attr("d", radarLine as any)
      .attr("fill", "#ef4444")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "#f59e0b")
      .attr("stroke-width", 2);
  }, [radarData]);

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <Activity className="w-10 h-10 text-zinc-800 mb-4" />
        <h3 className="text-lg font-black italic uppercase text-white">Baseline Data Required</h3>
        <p className="text-zinc-500 text-xs mt-2 text-center max-w-sm uppercase font-bold">Start your journey by completing your first biomechanical analysis.</p>
        <button 
          onClick={onBack}
          className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase italic tracking-widest shadow-lg shadow-red-600/20"
        >
          Begin First Session
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
        <div>
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Workspace</span>
          </button>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Performance Dossier</h1>
          <div className="flex items-center gap-2 mt-1">
            <Activity className="w-3 h-3 text-red-500" />
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Tracking: {currentUser?.name || 'Lead Athlete'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Telemetry Active
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-zinc-700">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Improvement', value: `${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}`, sub: 'vs Baseline', icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Latest Form', value: latestReport.overallScore.toFixed(1), sub: `Grade ${latestReport.overallGrade}`, icon: Target, color: 'text-white', bg: 'bg-zinc-800' },
          { label: 'Mastery Rate', value: `${drillStats.masteryRate}%`, sub: `${drillStats.masteredCount} Drills`, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Analyses', value: reports.length, sub: 'Total Audits', icon: Calendar, color: 'text-zinc-400', bg: 'bg-zinc-800' }
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black italic tracking-tighter ${kpi.color}`}>{kpi.value}</span>
            </div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-6">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic border-b border-zinc-800 pb-4">Kinetic Progression</h3>
          <div className="w-full">
            <svg ref={chartRef} className="w-full h-[280px]"></svg>
          </div>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-6">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic border-b border-zinc-800 pb-4">Biometric Balance</h3>
          <div className="w-full flex justify-center">
            <svg ref={radarRef} className="w-full h-[280px]"></svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Audit History Log</h2>
          <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{reports.length} Sessions</div>
        </div>
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {sortedReports.slice().reverse().map((report, i) => {
              const drills = report.report?.funCorrectiveDrills || [];
              const dp = report.drillProgress || {};
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-red-500/40 transition-all flex flex-col lg:flex-row lg:items-center gap-6"
                >
                  <div className="flex items-center gap-4 lg:w-1/4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black italic shrink-0 ${
                      report.overallScore >= 9 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      report.overallScore >= 8 ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      'bg-zinc-950 text-zinc-500 border border-zinc-800'
                    }`}>
                      {report.overallScore.toFixed(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight italic">{report.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{report.sportName}</span>
                        <span className="text-zinc-700 text-[8px]">•</span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {drills.slice(0, 3).map((drill, idx) => {
                      const status = dp[idx] || 'pending';
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                            status === 'mastered' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
                            status === 'completed' ? 'bg-red-500/10 border-red-500/40 text-red-500' :
                            'bg-zinc-950 border-zinc-800 text-zinc-600'
                          }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[100px]">{drill.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="lg:w-1/6 flex justify-end">
                    <button
                      onClick={() => onSelectReport?.(report)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest transition-all"
                    >
                      Dossier
                      <ArrowRight className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
