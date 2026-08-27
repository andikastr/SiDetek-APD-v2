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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Clean Subtitle Bar */}
      <div className="pb-3 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Statistical breakdown of personal protective equipment adoption and jobsite safety performance.
        </p>

        <span className="text-[11px] text-slate-500 font-technical">
          Standard: ISO 45001 &amp; OSHA 1926
        </span>
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
          variant="default"
        />
        <StatCard
          title="Engine Latency"
          value={isLoading ? "—" : `${data?.avgLatencyMs ?? 0} ms`}
          subtitle="Pure ONNX CPU latency"
          icon={Zap}
          variant="amber"
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
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Jobsite Compliance Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of inspection outcomes across compliant, partial, and violation sessions
            </p>
          </div>

          {/* Color Segments Bar */}
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
              <div
                style={{ width: `${compliantPercent}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Compliant: ${compliantPercent}%`}
              />
              <div
                style={{ width: `${partialPercent}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Partial: ${partialPercent}%`}
              />
              <div
                style={{ width: `${violationPercent}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Violation: ${violationPercent}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-technical font-medium">
              <span>0% Threshold</span>
              <span>100% Benchmark</span>
            </div>
          </div>

          {/* 3 Metric Summary Boxes */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Compliant
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block font-technical">
                {data?.compliantCount ?? 0}
              </span>
              <span className="text-xs text-emerald-700 font-semibold mt-0.5 block font-technical">
                {compliantPercent}%
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/50">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Partial Warning
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block font-technical">
                {data?.partialCount ?? 0}
              </span>
              <span className="text-xs text-amber-700 font-semibold mt-0.5 block font-technical">
                {partialPercent}%
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/50">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Violation
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block font-technical">
                {data?.violationCount ?? 0}
              </span>
              <span className="text-xs text-rose-700 font-semibold mt-0.5 block font-technical">
                {violationPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: APD Volume (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Verified PPE Equipment Volume
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cumulative counts of detected safety helmets vs reflective vests
              </p>
            </div>

            <div className="space-y-5 pt-1 text-xs">
              {/* Helmet Volume Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-2 text-emerald-800">
                    <HardHat className="w-4 h-4 text-emerald-600" /> Safety Helmets
                  </span>
                  <span className="font-extrabold text-slate-900 font-technical">
                    {data?.totalHelmets ?? 0} units ({helmetRatio}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${helmetRatio}%` }}
                  />
                </div>
              </div>

              {/* Jacket Volume Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-2 text-amber-800">
                    <Shield className="w-4 h-4 text-amber-600" /> Reflective Vests
                  </span>
                  <span className="font-extrabold text-slate-900 font-technical">
                    {data?.totalJackets ?? 0} units ({jacketRatio}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${jacketRatio}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-technical">
            <span className="font-semibold text-slate-700">Total Verified PPE:</span>
            <span className="font-extrabold text-slate-900 text-sm">{totalPPE} units</span>
          </div>
        </div>
      </div>

      {/* Safety SOP Best Practices Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              K3 Automated Recommendation Engine
            </h3>
            <p className="text-xs text-slate-500">
              Automated standard operating procedure reminders based on recent audit trends
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <span className="font-bold text-slate-900 block mb-1">
              1. Entry Point Checkpoint
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Ensure turnstiles and jobsite entrance gates run automated camera scans before granting perimeter access to subcontractors.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <span className="font-bold text-slate-900 block mb-1">
              2. Nightshift Visibility
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Workers near tower cranes and excavation machinery must wear EN ISO 20471 Class 2 or 3 retroreflective vests at all times.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <span className="font-bold text-slate-900 block mb-1">
              3. Chin Strap Fastening
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              For elevated scaffolding and tower work, helmets must have 4-point chin straps secured per EN 397 / EN 12492 standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
