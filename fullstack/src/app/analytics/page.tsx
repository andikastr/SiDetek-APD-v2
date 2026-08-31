"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
  HardHat,
  Shield,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
  BookOpen,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { formatDate } from "@/lib/utils";

interface AnalyticsData {
  totalAudits: number;
  complianceRate: number;
  compliantCount: number;
  partialCount: number;
  violationCount: number;
  totalHelmets: number;
  totalJackets: number;
  avgScore: number;
  avgLatencyMs: number;
}

interface RecommendationItem {
  category: string;
  title: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  reference: string;
}

interface RecommendationMeta {
  id: string;
  complianceRate: number;
  totalAudits: number;
  createdAt: string;
  source?: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // AI Recommendation Engine states
  const [recommendations, setRecommendations] = useState<RecommendationItem[] | null>(null);
  const [recommendationMeta, setRecommendationMeta] = useState<RecommendationMeta | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch numerical analytics
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setIsLoading(false));

    // Fetch previously saved recommendations for this user
    fetch("/api/analytics/recommendations")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setRecommendations(json.data.items || []);
          setRecommendationMeta({
            id: json.data.id,
            complianceRate: json.data.complianceRate,
            totalAudits: json.data.totalAudits,
            createdAt: json.data.createdAt,
            source: json.data.source,
          });
        }
      })
      .catch((err) => console.error("Error fetching saved recommendations:", err))
      .finally(() => setIsLoadingRecs(false));
  }, []);

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    setRecError(null);

    try {
      const res = await fetch("/api/analytics/recommendations", {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setRecError(json.error || "Failed to generate AI recommendations. Please try again.");
        return;
      }

      setRecommendations(json.data.items || []);
      setRecommendationMeta({
        id: json.data.id,
        complianceRate: json.data.complianceRate,
        totalAudits: json.data.totalAudits,
        createdAt: json.data.createdAt,
        source: json.data.source,
      });
    } catch {
      setRecError("Network error while communicating with AI Engine. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const totalAudits = data?.totalAudits || 0;
  const compliantPercent =
    totalAudits > 0 ? Math.round(((data?.compliantCount || 0) / totalAudits) * 100) : 0;
  const partialPercent =
    totalAudits > 0 ? Math.round(((data?.partialCount || 0) / totalAudits) * 100) : 0;
  const violationPercent =
    totalAudits > 0 ? Math.round(((data?.violationCount || 0) / totalAudits) * 100) : 0;

  const totalPPE = (data?.totalHelmets || 0) + (data?.totalJackets || 0);
  const helmetRatio = totalPPE > 0 ? Math.round(((data?.totalHelmets || 0) / totalPPE) * 100) : 50;
  const jacketRatio = totalPPE > 0 ? Math.round(((data?.totalJackets || 0) / totalPPE) * 100) : 50;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Clean Subtitle Bar */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display uppercase transition-colors">
            Safety Analytics &amp; Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
            Statistical breakdown of personal protective equipment adoption and jobsite safety performance.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <span>STANDARDS: ISO 45001 &amp; OSHA 1926</span>
        </div>
      </div>

      {/* KPI StatCards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Overall Compliance"
          value={isLoading ? "—" : `${data?.complianceRate ?? 0}%`}
          subtitle="Target threshold: ≥ 90%"
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Average K3 Score"
          value={isLoading ? "—" : `${data?.avgScore ?? 0}/100`}
          subtitle="Cumulative session mean"
          icon={Activity}
          variant="orange"
        />
        <StatCard
          title="Engine Latency"
          value={isLoading ? "—" : `${data?.avgLatencyMs ? Math.round(data.avgLatencyMs) : 0} ms`}
          subtitle="Pure ONNX CPU latency"
          icon={Zap}
          variant="default"
        />
        <StatCard
          title="Full Compliance"
          value={isLoading ? "—" : `${compliantPercent}%`}
          subtitle={`${data?.compliantCount ?? 0} of ${totalAudits} sessions`}
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Distribution & APD Volume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Compliance Distribution (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] p-6 sm:p-7 shadow-sm dark:shadow-md space-y-6 text-slate-900 dark:text-white transition-colors">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display uppercase transition-colors">
              Jobsite Compliance Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
              Breakdown of inspection outcomes across compliant, partial, and violation sessions
            </p>
          </div>

          {/* Unified Enterprise Blue Segments Bar */}
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded-md overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors">
              <div
                style={{ width: `${compliantPercent}%` }}
                className="bg-[#2563EB] transition-all duration-500"
                title={`Compliant: ${compliantPercent}%`}
              />
              <div
                style={{ width: `${partialPercent}%` }}
                className="bg-[#60A5FA] transition-all duration-500"
                title={`Partial: ${partialPercent}%`}
              />
              <div
                style={{ width: `${violationPercent}%` }}
                className="bg-slate-400 dark:bg-slate-600 transition-all duration-500"
                title={`Violation: ${violationPercent}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0% THRESHOLD</span>
              <span>100% BENCHMARK</span>
            </div>
          </div>

          {/* 3 Unified Metric Summary Boxes */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                Compliant
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 block font-mono">
                {data?.compliantCount ?? 0}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block font-mono">
                {compliantPercent}%
              </span>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                Partial
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 block font-mono">
                {data?.partialCount ?? 0}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block font-mono">
                {partialPercent}%
              </span>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                Violation
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 block font-mono">
                {data?.violationCount ?? 0}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block font-mono">
                {violationPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: APD Volume (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] p-6 sm:p-7 shadow-sm dark:shadow-md flex flex-col justify-between space-y-6 text-slate-900 dark:text-white transition-colors">
          <div className="space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display uppercase transition-colors">
                Verified PPE Equipment Volume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
                Cumulative counts of detected safety helmets vs reflective vests
              </p>
            </div>

            <div className="space-y-5 pt-1 text-xs">
              {/* Helmet Volume Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <HardHat className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" /> Safety Helmets
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data?.totalHelmets ?? 0} units ({helmetRatio}%)
                  </span>
                </div>
                <div className="h-3.5 w-full rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] rounded-md transition-all duration-500"
                    style={{ width: `${helmetRatio}%` }}
                  />
                </div>
              </div>

              {/* Jacket Volume Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Shield className="w-4 h-4 text-[#60A5FA]" /> Reflective Vests
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {data?.totalJackets ?? 0} units ({jacketRatio}%)
                  </span>
                </div>
                <div className="h-3.5 w-full rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                  <div
                    className="h-full bg-[#60A5FA] rounded-md transition-all duration-500"
                    style={{ width: `${jacketRatio}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span className="font-semibold text-slate-700 dark:text-slate-300">TOTAL VERIFIED PPE:</span>
            <span className="font-bold text-slate-900 dark:text-white text-base font-mono">{totalPPE} UNITS</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ON-DEMAND GEMINI AI SAFETY RECOMMENDATION ENGINE                           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] p-6 sm:p-7 shadow-sm dark:shadow-md text-slate-900 dark:text-white transition-colors relative overflow-hidden">
        {/* Subtle Ambient Top Border Accent */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent opacity-80" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display uppercase tracking-tight">
                K3 Automated Recommendation Engine
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI-driven hazard mitigation protocols and compliance directives generated from your verified audit telemetry.
              </p>
            </div>
          </div>

          {/* Regenerate Action Button (Only visible when active recommendations exist) */}
          {recommendations && recommendations.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6] ${
                    isGenerating ? "animate-spin" : ""
                  }`}
                />
                <span>{isGenerating ? "Updating..." : "Regenerate"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {recError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{recError}</span>
          </div>
        )}

        {/* Dynamic Content View Area */}
        {isLoadingRecs ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-slate-400 font-mono text-xs animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
            <span>Loading safety intelligence history...</span>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          /* Active State: Display 3 Recommendation Cards */
          <div className="pt-5 space-y-4">
            {recommendationMeta && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                  <span>
                    Last analyzed: <strong className="text-slate-800 dark:text-slate-200">{formatDate(recommendationMeta.createdAt)}</strong>
                  </span>
                </span>
                <span>
                  Scoped to <strong className="text-slate-800 dark:text-slate-200">{recommendationMeta.totalAudits}</strong> audit sessions ({recommendationMeta.complianceRate}% compliance)
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {recommendations.map((rec, idx) => {
                const isHigh = rec.severity === "HIGH";
                const isMed = rec.severity === "MEDIUM";

                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      isHigh
                        ? "bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40"
                        : isMed
                        ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40"
                        : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                          {rec.category}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            isHigh
                              ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                              : isMed
                              ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
                              : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                          }`}
                        >
                          {rec.severity} RISK
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug font-display">
                        {rec.title}
                      </h4>

                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <BookOpen className="w-3 h-3 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />
                      <span className="truncate">{rec.reference}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State: Prompt User to Generate */
          <div className="py-10 sm:py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="max-w-md space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display">
                No AI Safety Recommendations Generated Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Click the button below to allow Gemini Safety Intelligence to synthesize your jobsite&apos;s verified PPE inspection records into prioritized risk mitigation directives.
              </p>
            </div>

            <button
              onClick={handleGenerateRecommendations}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Safety Directives...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate AI Recommendations</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
