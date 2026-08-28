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
  BarChart3,
  Sparkles,
} from "lucide-react";
import StatCard from "@/components/StatCard";

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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const totalAudits = data?.totalAudits || 0;
  const compliantPercent = totalAudits > 0 ? Math.round(((data?.compliantCount || 0) / totalAudits) * 100) : 0;
  const partialPercent = totalAudits > 0 ? Math.round(((data?.partialCount || 0) / totalAudits) * 100) : 0;
  const violationPercent = totalAudits > 0 ? Math.round(((data?.violationCount || 0) / totalAudits) * 100) : 0;

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

      {/* Safety SOP Best Practices Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] p-6 sm:p-7 shadow-sm dark:shadow-md text-slate-900 dark:text-white transition-colors">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display uppercase transition-colors">
              K3 Automated Recommendation Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
              Automated standard operating procedure reminders based on recent audit trends
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <span className="font-bold text-slate-900 dark:text-white block mb-1 font-mono text-[11px]">
              1. ENTRY POINT CHECKPOINT
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Ensure turnstiles and jobsite entrance gates run automated camera scans before granting perimeter access to subcontractors.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <span className="font-bold text-slate-900 dark:text-white block mb-1 font-mono text-[11px]">
              2. NIGHTSHIFT VISIBILITY
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Workers near tower cranes and excavation machinery must wear EN ISO 20471 Class 2 or 3 retroreflective vests at all times.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <span className="font-bold text-slate-900 dark:text-white block mb-1 font-mono text-[11px]">
              3. CHIN STRAP FASTENING
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              For elevated scaffolding and tower work, helmets must have 4-point chin straps secured per EN 397 / EN 12492 standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
