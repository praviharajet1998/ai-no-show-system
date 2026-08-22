"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronRight,
  User,
  Phone,
  FilterX,
} from "lucide-react";

import type { AppointmentRecord } from "@/lib/appointments-with-predictions";
import { RiskBadge } from "@/components/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AppointmentsTableProps {
  records: AppointmentRecord[];
}

type SortField = "date_asc" | "date_desc" | "risk_desc" | "risk_asc" | "name_asc";
type FilterTab = "all" | "high_risk" | "today" | "pending_outcome";

function getRelativeDateLabel(dateStr: string): { label: string; variant: "today" | "tomorrow" | "future" | "past" } {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateStr === todayStr) return { label: "Today", variant: "today" };

  const today = new Date(todayStr);
  const target = new Date(dateStr);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return { label: "Tomorrow", variant: "tomorrow" };
  if (diffDays === -1) return { label: "Yesterday", variant: "past" };
  if (diffDays < -1) return { label: `${Math.abs(diffDays)}d ago`, variant: "past" };
  return { label: `In ${diffDays}d`, variant: "future" };
}

export function AppointmentsTable({ records }: AppointmentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<SortField>("risk_desc");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.appointment.department) set.add(r.appointment.department);
    }
    return Array.from(set).sort();
  }, [records]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: records.length,
      high_risk: records.filter((r) => r.prediction?.risk_category === "High").length,
      today: records.filter((r) => r.appointment.appointment_day === todayStr).length,
      pending_outcome: records.filter(
        (r) => r.appointment.no_show === null && r.appointment.appointment_day <= todayStr
      ).length,
    };
  }, [records, todayStr]);

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Tab filter
        if (activeTab === "high_risk" && r.prediction?.risk_category !== "High") return false;
        if (activeTab === "today" && r.appointment.appointment_day !== todayStr) return false;
        if (
          activeTab === "pending_outcome" &&
          (r.appointment.no_show !== null || r.appointment.appointment_day > todayStr)
        )
          return false;

        // Department filter
        if (selectedDept !== "ALL" && (r.appointment.department ?? "General Medicine") !== selectedDept) {
          return false;
        }

        // Risk filter dropdown
        if (selectedRisk !== "ALL") {
          if (selectedRisk === "UNPREDICTED" && r.prediction) return false;
          if (selectedRisk !== "UNPREDICTED" && r.prediction?.risk_category !== selectedRisk) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (r.patient?.full_name ?? "").toLowerCase();
          const phone = (r.patient?.phone ?? "").toLowerCase();
          const email = (r.patient?.email ?? "").toLowerCase();
          const dept = (r.appointment.department ?? "").toLowerCase();
          if (!name.includes(q) && !phone.includes(q) && !email.includes(q) && !dept.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "risk_desc") {
          const scoreA = a.prediction?.risk_score ?? -1;
          const scoreB = b.prediction?.risk_score ?? -1;
          return scoreB - scoreA;
        }
        if (sortOption === "risk_asc") {
          const scoreA = a.prediction?.risk_score ?? 999;
          const scoreB = b.prediction?.risk_score ?? 999;
          return scoreA - scoreB;
        }
        if (sortOption === "date_asc") {
          return a.appointment.appointment_day.localeCompare(b.appointment.appointment_day);
        }
        if (sortOption === "date_desc") {
          return b.appointment.appointment_day.localeCompare(a.appointment.appointment_day);
        }
        if (sortOption === "name_asc") {
          const nameA = a.patient?.full_name ?? "";
          const nameB = b.patient?.full_name ?? "";
          return nameA.localeCompare(nameB);
        }
        return 0;
      });
  }, [records, activeTab, selectedDept, selectedRisk, searchQuery, sortOption, todayStr]);

  function resetFilters() {
    setSearchQuery("");
    setSelectedDept("ALL");
    setSelectedRisk("ALL");
    setActiveTab("all");
    setSortOption("risk_desc");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>All Appointments</span>
            <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] tabular-nums">
              {tabCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("high_risk")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "high_risk"
                ? "bg-red-500/15 text-red-700 dark:text-red-300 font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="size-3.5 text-red-500" />
            <span>High Risk Triage</span>
            <span className="rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] font-bold text-red-600 dark:text-red-300 tabular-nums">
              {tabCounts.high_risk}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "today"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="size-3.5 text-primary" />
            <span>Today&apos;s Schedule</span>
            <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] tabular-nums">
              {tabCounts.today}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending_outcome")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "pending_outcome"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="size-3.5 text-amber-500" />
            <span>Pending Outcome</span>
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300 tabular-nums">
              {tabCounts.pending_outcome}
            </span>
          </button>
        </div>

        <span className="text-xs text-muted-foreground tabular-nums">
          Showing <strong>{filteredRecords.length}</strong> of {records.length} appointments
        </span>
      </div>

      {/* Filter / Search Controls Row */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
        {/* Search */}
        <div className="relative sm:col-span-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patient, phone, department…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Department Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 dark:bg-card text-foreground"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="sm:col-span-2">
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 dark:bg-card text-foreground"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="High">🔴 High Risk</option>
            <option value="Medium">🟡 Medium Risk</option>
            <option value="Low">🟢 Low Risk</option>
            <option value="UNPREDICTED">⚪ Unpredicted</option>
          </select>
        </div>

        {/* Sort */}
        <div className="sm:col-span-2">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortField)}
            className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 dark:bg-card text-foreground"
          >
            <option value="risk_desc">Risk (High → Low)</option>
            <option value="risk_asc">Risk (Low → High)</option>
            <option value="date_asc">Date (Earliest)</option>
            <option value="date_desc">Date (Latest)</option>
            <option value="name_asc">Patient Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center px-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FilterX className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground text-sm">No matching appointments</span>
              <span className="text-xs text-muted-foreground max-w-sm">
                No appointments match your active search and filter criteria.
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
              Clear all filters
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[28%]">Patient</TableHead>
                <TableHead className="w-[22%]">Appointment Date</TableHead>
                <TableHead className="w-[18%]">AI Risk Assessment</TableHead>
                <TableHead className="w-[22%]">Recommended Action</TableHead>
                <TableHead className="w-[10%] text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map(({ appointment, patient, prediction }) => {
                const relative = getRelativeDateLabel(appointment.appointment_day);
                const isHighRisk = prediction?.risk_category === "High";

                return (
                  <TableRow
                    key={appointment.id}
                    className={`group transition-colors ${
                      isHighRisk
                        ? "bg-red-500/[0.03] hover:bg-red-500/[0.07] dark:bg-red-950/[0.15] dark:hover:bg-red-950/[0.25]"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {/* Patient Column */}
                    <TableCell className="align-middle">
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="flex items-center gap-3 group-hover:opacity-90"
                      >
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isHighRisk
                              ? "bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {patient?.full_name
                            ? patient.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            : <User className="size-4" />}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm truncate">
                            {patient?.full_name ?? "Unknown Patient"}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {patient?.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="size-3" />
                                {patient.phone}
                              </span>
                            ) : (
                              <span>DOB: {patient?.date_of_birth ?? "—"}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </TableCell>

                    {/* Appointment Date & Department */}
                    <TableCell className="align-middle">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground text-xs tabular-nums">
                            {appointment.appointment_day}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold tabular-nums ${
                              relative.variant === "today"
                                ? "bg-primary text-primary-foreground"
                                : relative.variant === "tomorrow"
                                ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                                : relative.variant === "past"
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {relative.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {appointment.department ?? "General Medicine"}
                          {appointment.sms_received && " • SMS sent"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Risk Badge & Score */}
                    <TableCell className="align-middle">
                      {prediction ? (
                        <div className="flex flex-col gap-1">
                          <RiskBadge
                            category={prediction.risk_category}
                            score={prediction.risk_score}
                            size="sm"
                          />
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px]">
                          Unpredicted
                        </Badge>
                      )}
                    </TableCell>

                    {/* Action Recommendation */}
                    <TableCell className="align-middle">
                      {prediction ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className={`line-clamp-2 ${
                              isHighRisk
                                ? "font-medium text-red-700 dark:text-red-300"
                                : "text-muted-foreground"
                            }`}
                          >
                            {prediction.recommendation}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Details Action */}
                    <TableCell className="text-right align-middle">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground group-hover:text-primary transition-colors"
                        nativeButton={false}
                        render={
                          <Link href={`/appointments/${appointment.id}`}>
                            <ChevronRight className="size-4" />
                            <span className="sr-only">View appointment</span>
                          </Link>
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
