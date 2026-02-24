"use client";

import { useState, useEffect } from "react";
import { Plus, Filter } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { KanbanBoard } from "@/components/admin/KanbanBoard";
import { TeamDashboard } from "@/components/admin/TeamDashboard";
import { CorrespondenceView } from "@/components/admin/CorrespondenceView";
import { MessengerView } from "@/components/admin/MessengerView";
import { CaseWizard } from "@/components/admin/CaseWizard";
import { CaseDetailModal } from "@/components/admin/CaseDetailModal";
import { EmployeeManagement } from "@/components/admin/EmployeeManagement";
import { listEmployees, type Employee } from "@/app/actions/employees";

import type { CaseType } from "@/types";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"dashboard" | "cases" | "tasks" | "correspondences" | "handover" | "employees">("dashboard");
    const [taskFilter, setTaskFilter] = useState("Alle");
    const [caseTypeFilter, setCaseTypeFilter] = useState<CaseType | "alle">("alle");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

    useEffect(() => {
        listEmployees().then(setEmployees);
    }, [activeTab]);

    const openCreateModal = () => {
        setIsWizardOpen(true);
    };

    return (
        <AdminShell activeTab={activeTab} setActiveTab={setActiveTab}>
            <div className="flex flex-col h-full overflow-hidden">
                <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
                    <h2 className="text-xl sm:text-2xl font-serif text-gray-800">
                        {activeTab === "dashboard" ? "Dashboard" : activeTab === "cases" ? "Kanban-Board" : activeTab === "tasks" ? "Team Dashboard" : activeTab === "correspondences" ? "Korrespondenzen" : activeTab === "handover" ? "Messenger" : "HR / Personal"}
                    </h2>

                    {activeTab === "cases" && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                <Filter size={16} className="text-gray-400 ml-2" />
                                <select
                                    value={caseTypeFilter}
                                    onChange={(e) => setCaseTypeFilter(e.target.value as CaseType | "alle")}
                                    className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none pr-2 cursor-pointer"
                                >
                                    <option value="alle">Alle Falltypen</option>
                                    <option value="vorsorge">Vorsorge</option>
                                    <option value="trauerfall">Trauerfall</option>
                                    <option value="beratung">Beratung</option>
                                    <option value="sonstiges">Sonstiges</option>
                                </select>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="bg-mw-green text-white px-6 py-2.5 rounded-xl hover:bg-mw-green-dark text-sm font-medium flex gap-2 transition shadow-sm"
                            >
                                <Plus size={18} /> Neuer Fall
                            </button>
                        </div>
                    )}

                    {activeTab === "employees" && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            Mitarbeiter, Rechte und E-Mail-Konten verwalten
                        </div>
                    )}
                    {activeTab === "tasks" && (
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                            <Filter size={16} className="text-gray-400 ml-2" />
                            <select
                                value={taskFilter}
                                onChange={(e) => setTaskFilter(e.target.value)}
                                className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none pr-2 cursor-pointer"
                            >
                                <option value="Alle">Alle Aufgaben</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        Meine Aufgaben ({emp.display_name})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f3f4f6] relative">
                    {activeTab === "dashboard" && <DashboardOverview onNavigate={setActiveTab} />}
                    {activeTab === "cases" && <KanbanBoard onCaseClick={setActiveCaseId} caseTypeFilter={caseTypeFilter} />}
                    {activeTab === "tasks" && <TeamDashboard taskFilter={taskFilter} employees={employees} onOpenCase={setActiveCaseId} />}
                    {activeTab === "correspondences" && <CorrespondenceView />}
                    {activeTab === "handover" && <MessengerView />}
                    {activeTab === "employees" && <EmployeeManagement />}
                </div>
            </div>

            <CaseWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />
            <CaseDetailModal activeCaseId={activeCaseId} onClose={() => setActiveCaseId(null)} />
        </AdminShell>
    );
}
