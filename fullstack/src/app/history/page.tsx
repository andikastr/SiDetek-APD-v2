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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Official Print Header (Visible only when printing report) */}
      <div className="hidden print:block pb-6 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
              SIDETEK-APD · INDUSTRIAL K3 VISION SURVEILLANCE
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              OFFICIAL PPE COMPLIANCE AUDIT REPORT
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Automated Optical Safety Inspection Evidence Log
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 font-technical">
            <p>Compliance Standards: EN 397 · EN ISO 20471</p>
            <p>Report Date: {new Date().toLocaleDateString("en-US")}</p>
          </div>
        </div>
      </div>

      {/* Screen Top Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <p className="text-xs text-slate-500">
            Archived compliance evidence recorded from local image inspections and real-time CCTV streams.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Print formal K3 audit report"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Report</span>
          </button>

          {records.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Filters & Search Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source Dropdown & Search Input */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename or session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 font-medium"
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Methods</option>
            <option value="UPLOAD">Photo Upload</option>
            <option value="WEBCAM">CCTV / Webcam</option>
          </select>
        </div>
      </div>

      {/* Structured Formal Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden print-card">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium">
            Loading inspection records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              No matching audit records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/60 font-technical">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-4">File / Session</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Identified PPE</th>
                  <th className="py-3.5 px-4 text-center">Latency</th>
                  <th className="py-3.5 px-6 text-right">Score</th>
                  <th className="py-3.5 px-4 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-slate-900 text-xs font-technical whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(record.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800 max-w-[200px] truncate" title={record.fileName || ""}>
                      {record.fileName || "Live Session"}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 capitalize">
                        {record.source.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ComplianceBadge status={record.complianceStatus} size="sm" />
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-xs font-medium">
                      <span className="text-emerald-700">{record.helmetCount} helmets</span>
                      <span className="text-slate-300 mx-1">•</span>
                      <span className="text-amber-700">{record.jacketCount} vests</span>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-500 font-technical text-[11px]">
                      {record.inferenceMs} ms
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-900 font-technical text-sm">
                      {record.complianceScore}%
                    </td>
                    <td className="py-4 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Inspection Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRecordToDelete(record)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Record"
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

      {/* Detail Modal */}
      {selectedRecord && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecord(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print"
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Safety Audit Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-technical">
                  {formatDate(selectedRecord.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRecord.annotatedImageUrl && (
              <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-[340px] flex items-center justify-center border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedRecord.annotatedImageUrl}
                  alt="Audit Detail"
                  className="max-h-[340px] w-auto object-contain"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] text-slate-500 font-semibold block">Compliance</span>
                <div className="mt-1.5">
                  <ComplianceBadge status={selectedRecord.complianceStatus} size="sm" />
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] text-slate-500 font-semibold block">K3 Score</span>
                <span className="text-lg font-extrabold text-slate-900 mt-1 block font-technical">
                  {selectedRecord.complianceScore}%
                </span>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] text-slate-500 font-semibold block">Helmets / Vests</span>
                <span className="text-lg font-extrabold text-slate-900 mt-1 block font-technical">
                  {selectedRecord.helmetCount} / {selectedRecord.jacketCount}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60">
                <span className="text-[11px] text-slate-500 font-semibold block">AI Latency</span>
                <span className="text-lg font-extrabold text-slate-900 mt-1 block font-technical">
                  {selectedRecord.inferenceMs} ms
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRecordToDelete(selectedRecord)}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Delete Audit Record?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-800 font-mono">
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
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingle}
                disabled={isDeletingSingle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Clear All Audit Records?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                All saved inspection logs, worker evidence, and compliance timestamps will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 text-xs font-semibold pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
