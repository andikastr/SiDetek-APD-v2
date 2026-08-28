"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  Eye,
  X,
  Printer,
  Search,
  FileSpreadsheet,
  HardHat,
  Shield,
  Clock,
  Filter,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { AuditRecord } from "@/types";
import ComplianceBadge from "@/components/ComplianceBadge";
import { formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<AuditRecord | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState<boolean>(false);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const url = `/api/history?status=${filterStatus}&source=${filterSource}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch (e) {
      console.error("Failed to load audit history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterSource]);

  // Lock body scrolling when any modal is open to prevent page scroll bleed
  useEffect(() => {
    if (selectedRecord || recordToDelete || showDeleteAllModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedRecord, recordToDelete, showDeleteAllModal]);

  const confirmDeleteSingle = async () => {
    if (!recordToDelete) return;
    setIsDeletingSingle(true);
    try {
      const res = await fetch(`/api/history?id=${recordToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
        if (selectedRecord?.id === recordToDelete.id) setSelectedRecord(null);
        setRecordToDelete(null);
      } else {
        throw new Error("Failed to delete record.");
      }
    } catch {
      alert("Failed to delete record.");
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const res = await fetch("/api/history?all=true", { method: "DELETE" });
      if (res.ok) {
        setRecords([]);
        setSelectedRecord(null);
        setShowDeleteAllModal(false);
      } else {
        throw new Error("Failed to clear audit records.");
      }
    } catch {
      alert("Failed to delete records.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRecords = records.filter((r) =>
    (r.fileName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Official Print Header (Visible only when printing report) */}
      <div className="hidden print-only mb-6 border-b-2 border-black pb-4 text-black">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">
              SiDetek-APD — Laporan Resmi Kepatuhan APD K3
            </h1>
            <p className="text-xs text-gray-700 mt-1">
              Dokumen Audit Otomatis Keselamatan Kerja Proyek Konstruksi &amp; Industri
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-mono">Tanggal Cetak: {new Date().toLocaleDateString("id-ID")}</p>
            <p className="font-mono text-gray-600">Standar Acuan: EN 397 &amp; EN ISO 20471</p>
          </div>
        </div>
      </div>

      {/* Screen Top Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display uppercase transition-colors">
            Safety Audit Logbook
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
            Archived compliance evidence recorded from local image inspections and real-time CCTV streams.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800/80 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Print formal K3 audit report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
            <span>Print Report</span>
          </button>

          {records.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Filters & Search Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] shadow-sm dark:shadow-md transition-colors">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: "ALL", label: "All Records" },
            { id: "COMPLIANT", label: "Compliant" },
            { id: "PARTIAL", label: "Partial" },
            { id: "NON_COMPLIANT", label: "Violation" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs border border-slate-300 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source Dropdown & Search Input */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename or session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] font-medium transition-colors"
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#0E1626] text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] cursor-pointer"
          >
            <option value="ALL">All Methods</option>
            <option value="UPLOAD">Photo Upload</option>
            <option value="WEBCAM">CCTV / Webcam</option>
          </select>
        </div>
      </div>

      {/* Structured Formal Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] shadow-sm dark:shadow-md overflow-hidden print-card transition-colors">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-mono">
            Loading inspection records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              No matching audit records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider text-[10px] bg-slate-50 dark:bg-slate-800/20">
                <tr>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-4">File / Session</th>
                  <th className="py-4 px-4">Method</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Identified PPE</th>
                  <th className="py-4 px-4 text-center">Latency</th>
                  <th className="py-4 px-6 text-right">Score</th>
                  <th className="py-4 px-4 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(record.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate" title={record.fileName || ""}>
                      {record.fileName || "Live Session"}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                        {record.source}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ComplianceBadge status={record.complianceStatus} size="sm" />
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{record.helmetCount} helmets</span>
                      <span className="text-slate-300 dark:text-slate-600 mx-1.5">•</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{record.jacketCount} vests</span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {record.inferenceMs} ms
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {record.complianceScore}%
                    </td>
                    <td className="py-4 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Inspect audit details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRecordToDelete(record)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspector Modal */}
      {selectedRecord && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecord(null);
          }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 no-print overflow-y-auto"
        >
          <div className="bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto transition-colors">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Safety Audit Details
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 font-semibold uppercase">
                    {selectedRecord.source}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {selectedRecord.fileName || "Live Session"} • {formatDate(selectedRecord.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Annotated Image Viewport */}
            {selectedRecord.annotatedImageUrl ? (
              <div className="rounded-lg overflow-hidden bg-slate-950 max-h-[320px] flex items-center justify-center border border-slate-200 dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedRecord.annotatedImageUrl}
                  alt="Audit Detail Annotated Capture"
                  className="max-h-[320px] w-auto object-contain"
                />
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <span>Numerical telemetry &amp; sensor metadata record preserved.</span>
              </div>
            )}

            {/* Key Metrics 4-Box Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">Compliance</span>
                <div className="mt-1.5">
                  <ComplianceBadge status={selectedRecord.complianceStatus} size="sm" />
                </div>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">K3 Score</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
                  {selectedRecord.complianceScore}%
                </span>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">Helmets / Vests</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
                  {selectedRecord.helmetCount} / {selectedRecord.jacketCount}
                </span>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">AI Latency</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 block font-mono">
                  {selectedRecord.inferenceMs} ms
                </span>
              </div>
            </div>

            {/* Identified PPE Units List (if available in items) */}
            {selectedRecord.items && selectedRecord.items.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Detected PPE Units ({selectedRecord.items.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {selectedRecord.items.map((item, idx) => {
                    const isHelmet = item.label.toLowerCase().includes("helmet");
                    return (
                      <div
                        key={item.id || idx}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {isHelmet ? <HardHat className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> : <Shield className="w-3.5 h-3.5 text-[#60A5FA]" />}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {Math.round((item.confidence || 0) * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Audit Notes & Recommendations */}
            {selectedRecord.notes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Findings &amp; Recommendations:
                </span>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {selectedRecord.notes.split(";").map((note, idx) => {
                    const trimmed = note.trim();
                    if (!trimmed) return null;
                    return (
                      <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-[#2563EB] dark:text-[#3B82F6] font-bold mt-0.5">•</span>
                        <span>{trimmed}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const target = selectedRecord;
                  setSelectedRecord(null);
                  setRecordToDelete(target);
                }}
                className="px-4 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-6 py-2 rounded-lg btn-caldera-primary text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Record Delete Confirmation Modal */}
      {recordToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingSingle) setRecordToDelete(null);
          }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 no-print overflow-y-auto"
        >
          <div className="bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
            <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-display">
                Delete Audit Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {recordToDelete.fileName || "this audit record"}
                </span>
                ? All bounding boxes and inspection details will be permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 text-xs font-semibold pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeletingSingle}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingle}
                disabled={isDeletingSingle}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm font-semibold uppercase tracking-wider"
              >
                {isDeletingSingle ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingAll) setShowDeleteAllModal(false);
          }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 no-print overflow-y-auto"
        >
          <div className="bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
            <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-display">
                Clear All Audit Records?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                All saved inspection logs, worker evidence, and compliance timestamps will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 text-xs font-semibold pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="px-5 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 font-semibold uppercase tracking-wider"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting All...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Logs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
