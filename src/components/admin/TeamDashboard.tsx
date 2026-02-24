"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, CheckCircle, Trash2, Clock, List, Calendar, Pencil, X, Package } from "lucide-react";
import { Appointment, Task, InventoryItem } from "@/types";
import { supabase } from "@/lib/supabase";
import { getTasks } from "@/app/actions/tasks";
import { getAppointments } from "@/app/actions/appointments";
import { getCasesList } from "@/app/actions/cases";
import { getInventoryItems, assignInventoryItemToCaseAction } from "@/app/actions/inventory";
import type { Employee } from "@/app/actions/employees";
import { getTimeEntries } from "@/app/actions/time-entries";
import { getEvents } from "@/app/actions/events";
import type { TimeEntryEvent } from "@/app/actions/time-entries";
import { CalendarView } from "./CalendarView";
import { AgendaSection, computeReminderAt, type ReminderMinutes } from "./AgendaSection";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { queryKeys } from "@/lib/query-keys";

type ViewMode = "list" | "calendar";

interface TeamDashboardProps {
    taskFilter: string;
    employees: Employee[];
    onOpenCase?: (caseId: string) => void;
}

export function TeamDashboard({ taskFilter, employees, onOpenCase }: TeamDashboardProps) {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<ViewMode>("list");

    const { data: tasks = [] } = useQuery({ queryKey: queryKeys.tasks, queryFn: getTasks });
    const { data: appointments = [] } = useQuery({ queryKey: queryKeys.appointments, queryFn: getAppointments });
    const { data: cases = [] } = useQuery({ queryKey: queryKeys.casesList, queryFn: getCasesList });
    const { data: inventoryData } = useQuery({
        queryKey: queryKeys.inventory({}),
        queryFn: async () => {
            const [assigned, all] = await Promise.all([
                getInventoryItems({ assignedOnly: true }),
                getInventoryItems(),
            ]);
            return { assigned, all };
        },
    });
    const assignedItems = inventoryData?.assigned ?? [];
    const allItems = inventoryData?.all ?? [];

    const now = new Date();
    const timeEntriesFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const timeEntriesTo = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const { data: timeEntries = [] } = useQuery({
        queryKey: queryKeys.timeEntries(taskFilter === "Alle" ? null : taskFilter, timeEntriesFrom, timeEntriesTo),
        queryFn: () => getTimeEntries(taskFilter === "Alle" ? null : taskFilter, timeEntriesFrom, timeEntriesTo),
    });
    const eventsFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const eventsTo = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    const { data: companyEvents = [] } = useQuery({
        queryKey: queryKeys.events(eventsFrom, eventsTo),
        queryFn: () => getEvents(eventsFrom, eventsTo),
    });

    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string | null>(null);
    const [newTaskDueDate, setNewTaskDueDate] = useState("");
    const [newTaskCaseId, setNewTaskCaseId] = useState<string | null>(null);
    const [newTaskReminder, setNewTaskReminder] = useState<ReminderMinutes>("");

    const [newApptTitle, setNewApptTitle] = useState("");
    const [newApptDate, setNewApptDate] = useState("");
    const [newApptEndDate, setNewApptEndDate] = useState("");
    const [newApptCaseId, setNewApptCaseId] = useState<string | null>(null);
    const [newApptAssigneeId, setNewApptAssigneeId] = useState<string | null>(null);
    const [newApptReminder, setNewApptReminder] = useState<ReminderMinutes>("");

    const [editingApptId, setEditingApptId] = useState<string | null>(null);
    const [editApptTitle, setEditApptTitle] = useState("");
    const [editApptDate, setEditApptDate] = useState("");
    const [editApptEndDate, setEditApptEndDate] = useState("");
    const [editApptCaseId, setEditApptCaseId] = useState<string | null>(null);
    const [editApptAssigneeId, setEditApptAssigneeId] = useState<string | null>(null);
    const [editApptReminder, setEditApptReminder] = useState<ReminderMinutes>("");

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [editTaskDueDate, setEditTaskDueDate] = useState("");
    const [editTaskAssigneeId, setEditTaskAssigneeId] = useState<string | null>(null);
    const [editTaskCaseId, setEditTaskCaseId] = useState<string | null>(null);
    const [editTaskCompleted, setEditTaskCompleted] = useState(false);
    const [editTaskReminder, setEditTaskReminder] = useState<ReminderMinutes>("");

    const [assignItemId, setAssignItemId] = useState<string | null>(null);
    const [assignCaseId, setAssignCaseId] = useState<string | null>(null);
    const [assignStatus, setAssignStatus] = useState<"reserved" | "assigned" | "delivered">("assigned");

    const [showTimeEntries, setShowTimeEntries] = useState(true);

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
        queryClient.invalidateQueries({ queryKey: queryKeys.casesList });
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory({}) });
        queryClient.invalidateQueries({ predicate: (q) => (q.queryKey as string[])[0] === "timeEntries" });
        queryClient.invalidateQueries({ predicate: (q) => (q.queryKey as string[])[0] === "events" });
    }, [queryClient]);

    useEffect(() => {
        window.addEventListener("fetch-cases", invalidateAll);
        return () => window.removeEventListener("fetch-cases", invalidateAll);
    }, [invalidateAll]);

    useRealtimeTable({ table: "tasks" }, invalidateAll);
    useRealtimeTable({ table: "appointments" }, invalidateAll);
    useRealtimeTable({ table: "cases" }, invalidateAll);
    useRealtimeTable({ table: "inventory_items" }, invalidateAll);
    useRealtimeTable({ table: "employee_time_entries" }, invalidateAll);
    useRealtimeTable({ table: "events" }, invalidateAll);

    const filteredTasks = tasks
        .filter((t) => {
            if (taskFilter === "Alle") return true;
            return t.assigneeId === taskFilter || t.assignee === taskFilter;
        })
        .sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle) return;

        const newTask = {
            title: newTaskTitle,
            assignee: newTaskAssigneeId ? (employees.find((e) => e.id === newTaskAssigneeId)?.display_name ?? "Alle") : "Alle",
            assignee_id: newTaskAssigneeId || null,
            due_date: newTaskDueDate || null,
            completed: false,
            case_id: newTaskCaseId || null,
            reminder_at: newTaskDueDate ? computeReminderAt(newTaskDueDate + "T09:00:00", newTaskReminder) : null,
        };

        const { error } = await supabase.from('tasks').insert(newTask);
        if (!error) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            setNewTaskTitle("");
            setNewTaskDueDate("");
            setNewTaskReminder("");
        } else {
            console.error("Failed to add task:", error);
        }
    };

    const handleAddAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newApptTitle || !newApptDate) return;

        const newAppt = {
            title: newApptTitle,
            appointment_date: newApptDate,
            end_at: newApptEndDate || null,
            case_id: newApptCaseId || null,
            assignee_id: newApptAssigneeId || null,
            assignee: newApptAssigneeId ? (employees.find((e) => e.id === newApptAssigneeId)?.display_name ?? "Alle") : "Alle",
            reminder_at: computeReminderAt(newApptDate, newApptReminder),
        };

        const { error } = await supabase.from('appointments').insert(newAppt);
        if (!error) {
            queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
            setNewApptTitle("");
            setNewApptDate("");
            setNewApptEndDate("");
            setNewApptReminder("");
        } else {
            console.error("Failed to add appointment:", error);
        }
    };

    const startEditAppointment = (appt: Appointment) => {
        setEditingApptId(appt.id);
        setEditApptTitle(appt.title);
        setEditApptDate(appt.date.slice(0, 16));
        setEditApptEndDate(appt.endAt ? appt.endAt.slice(0, 16) : "");
        setEditApptCaseId(appt.caseId ?? null);
        setEditApptAssigneeId(appt.assigneeId ?? null);
        setEditApptReminder(getReminderFromAt(appt.date, appt.reminderAt));
    };

    const cancelEditAppointment = () => {
        setEditingApptId(null);
        setEditApptTitle("");
        setEditApptDate("");
        setEditApptEndDate("");
        setEditApptCaseId(null);
        setEditApptAssigneeId(null);
        setEditApptReminder("");
    };

    function getReminderFromAt(dateIso: string, reminderAt: string | null | undefined): ReminderMinutes {
        if (!reminderAt || !dateIso) return "";
        const d = new Date(dateIso);
        const r = new Date(reminderAt);
        const mins = Math.round((d.getTime() - r.getTime()) / 60000);
        if (mins <= 15) return "15";
        if (mins <= 60) return "60";
        if (mins <= 1440) return "1440";
        if (mins <= 4320) return "4320";
        return "";
    }

    const handleUpdateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingApptId || !editApptTitle || !editApptDate) return;

        const { error } = await supabase
            .from('appointments')
            .update({
                title: editApptTitle,
                appointment_date: editApptDate,
                end_at: editApptEndDate || null,
                case_id: editApptCaseId || null,
                assignee_id: editApptAssigneeId || null,
                assignee: editApptAssigneeId ? (employees.find((e) => e.id === editApptAssigneeId)?.display_name ?? "Alle") : "Alle",
                reminder_at: computeReminderAt(editApptDate, editApptReminder),
            })
            .eq('id', editingApptId);

        if (!error) {
            queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
            cancelEditAppointment();
        } else {
            console.error("Failed to update appointment:", error);
        }
    };

    const deleteAppointment = async (id: string) => {
        if (!confirm("Termin löschen?")) return;
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (!error) queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
    };

    const getCaseName = (caseId: string | null | undefined) =>
        caseId ? cases.find((c) => c.id === caseId)?.name ?? null : null;

    const stripCaseTypePrefix = (name: string) => name.replace(/^(VORSORGE|TRAUERFALL|BERATUNG):\s*/i, "").trim();
    const getCaseTypeLabel = (name: string) =>
        name.startsWith("VORSORGE:") ? "Vorsorge" : name.startsWith("TRAUERFALL:") ? "Trauerfall" : name.startsWith("BERATUNG:") ? "Beratung" : null;

    const getCaseDisplayLabel = (caseId: string | null | undefined) => {
        if (!caseId) return null;
        const c = cases.find((x) => x.id === caseId);
        if (!c) return null;
        const typeLabel = getCaseTypeLabel(c.name);
        if (typeLabel) return `${typeLabel}: ${stripCaseTypePrefix(c.name)}`;
        const contact = c.contact as { firstName?: string; lastName?: string } | undefined;
        if (contact?.firstName || contact?.lastName) {
            const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
            if (name) return `mit ${name}`;
        }
        return c.name;
    };

    const toggleTask = async (task: Task) => {
        const { error } = await supabase
            .from('tasks')
            .update({ completed: !task.completed })
            .eq('id', task.id);

        if (!error) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
        }
    };

    const deleteTask = async (id: string) => {
        if (!confirm("Aufgabe wirklich löschen?")) return;
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (!error) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
        }
    };

    const startEditTask = (task: Task) => {
        setEditingTaskId(task.id);
        setEditTaskTitle(task.title);
        setEditTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
        setEditTaskAssigneeId(task.assigneeId ?? null);
        setEditTaskCaseId(task.caseId ?? null);
        setEditTaskCompleted(task.completed);
        setEditTaskReminder(task.dueDate ? getReminderFromAt(task.dueDate + "T09:00:00", task.reminderAt) : "");
    };

    const cancelEditTask = () => {
        setEditingTaskId(null);
        setEditTaskTitle("");
        setEditTaskDueDate("");
        setEditTaskAssigneeId(null);
        setEditTaskCaseId(null);
        setEditTaskCompleted(false);
        setEditTaskReminder("");
    };

    const handleAssignItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignItemId || !assignCaseId) return;
        const result = await assignInventoryItemToCaseAction(assignItemId, assignCaseId, assignStatus);
        if (result.success) {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory({}) });
            setAssignItemId(null);
            setAssignCaseId(null);
        } else {
            console.error("Assign failed:", result.error);
        }
    };

    const handleUnassignItem = async (itemId: string) => {
        if (!confirm("Gegenstand von Fall trennen?")) return;
        const result = await assignInventoryItemToCaseAction(itemId, null);
        if (result.success) queryClient.invalidateQueries({ queryKey: queryKeys.inventory({}) });
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTaskId || !editTaskTitle) return;

        const { error } = await supabase
            .from('tasks')
            .update({
                title: editTaskTitle,
                due_date: editTaskDueDate || null,
                assignee_id: editTaskAssigneeId || null,
                assignee: editTaskAssigneeId ? (employees.find((e) => e.id === editTaskAssigneeId)?.display_name ?? "Alle") : "Alle",
                case_id: editTaskCaseId || null,
                completed: editTaskCompleted,
                reminder_at: editTaskDueDate ? computeReminderAt(editTaskDueDate + "T09:00:00", editTaskReminder) : null,
            })
            .eq('id', editingTaskId);

        if (!error) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            cancelEditTask();
        } else {
            console.error("Failed to update task:", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            {/* View Switcher */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 mr-2">Ansicht:</span>
                    <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === "list" ? "bg-white shadow-sm text-mw-green border border-gray-200" : "text-gray-600 hover:text-gray-800"}`}
                        >
                            <List size={16} /> Liste
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("calendar")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === "calendar" ? "bg-white shadow-sm text-mw-green border border-gray-200" : "text-gray-600 hover:text-gray-800"}`}
                        >
                            <Calendar size={16} /> Kalender
                        </button>
                    </div>
                </div>
                {viewMode === "calendar" && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showTimeEntries}
                            onChange={(e) => setShowTimeEntries(e.target.checked)}
                            className="rounded border-gray-300 text-mw-green focus:ring-mw-green"
                        />
                        Arbeitszeiten anzeigen
                    </label>
                )}
            </div>

            {viewMode === "calendar" ? (
                <CalendarView
                    appointments={appointments}
                    tasks={filteredTasks}
                    companyEvents={companyEvents}
                    timeEntries={timeEntries}
                    employees={employees}
                    showTimeEntries={showTimeEntries}
                    cases={cases}
                    getCaseDisplayLabel={getCaseDisplayLabel}
                    onOpenCase={onOpenCase}
                    onEditAppointment={(appt) => {
                        setViewMode("list");
                        startEditAppointment(appt);
                    }}
                    onEditTask={(task) => {
                        setViewMode("list");
                        startEditTask(task);
                    }}
                    onDeleteAppointment={deleteAppointment}
                    onDeleteTask={deleteTask}
                    onCreateAppointment={async (data) => {
                        const newAppt = {
                            title: data.title,
                            appointment_date: data.start,
                            end_at: data.end || null,
                            case_id: data.caseId || null,
                            assignee_id: data.assigneeId || null,
                            assignee: data.assigneeId ? (employees.find((e) => e.id === data.assigneeId)?.display_name ?? "Alle") : "Alle",
                            reminder_at: data.reminderAt || null,
                        };
                        const { error } = await supabase.from("appointments").insert(newAppt);
                        if (!error) {
                            queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
                        } else {
                            console.error("Failed to add appointment:", error);
                            throw error;
                        }
                    }}
                />
            ) : (
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 lg:h-[55vh]">
            <div className="lg:col-span-4 min-h-0 flex flex-col lg:h-full">
            <AgendaSection
                appointments={appointments}
                cases={cases}
                employees={employees}
                newApptTitle={newApptTitle}
                newApptDate={newApptDate}
                newApptEndDate={newApptEndDate}
                newApptCaseId={newApptCaseId}
                newApptAssigneeId={newApptAssigneeId}
                newApptReminder={newApptReminder}
                editingApptId={editingApptId}
                editApptTitle={editApptTitle}
                editApptDate={editApptDate}
                editApptEndDate={editApptEndDate}
                editApptCaseId={editApptCaseId}
                editApptAssigneeId={editApptAssigneeId}
                editApptReminder={editApptReminder}
                onNewApptTitleChange={setNewApptTitle}
                onNewApptDateChange={setNewApptDate}
                onNewApptEndDateChange={setNewApptEndDate}
                onNewApptCaseIdChange={setNewApptCaseId}
                onNewApptAssigneeIdChange={setNewApptAssigneeId}
                onNewApptReminderChange={setNewApptReminder}
                onEditApptTitleChange={setEditApptTitle}
                onEditApptDateChange={setEditApptDate}
                onEditApptEndDateChange={setEditApptEndDate}
                onEditApptCaseIdChange={setEditApptCaseId}
                onEditApptAssigneeIdChange={setEditApptAssigneeId}
                onEditApptReminderChange={setEditApptReminder}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onStartEdit={startEditAppointment}
                onCancelEdit={cancelEditAppointment}
                onDelete={deleteAppointment}
                getCaseDisplayLabel={getCaseDisplayLabel}
            />
            </div>

            {/* Task List */}
            <div className="lg:col-span-8 min-h-0 lg:h-full bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-serif text-mw-green flex items-center gap-2 mb-4">
                        <CheckCircle size={20} /> To-Do Liste
                    </h3>
                    <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                        <input
                            type="text"
                            placeholder="Aufgabe eingeben..."
                            className="flex-1 min-w-0 p-3 bg-white rounded-xl shadow-sm outline-none text-sm"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            required
                        />
                        <div className="flex flex-wrap gap-2 min-w-0">
                            <select
                                value={newTaskCaseId ?? ""}
                                onChange={(e) => setNewTaskCaseId(e.target.value || null)}
                                className="w-36 p-3 bg-white rounded-xl shadow-sm outline-none text-sm"
                            >
                                <option value="">Fall (optional)</option>
                                {cases.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <select
                                value={newTaskAssigneeId ?? ""}
                                onChange={(e) => setNewTaskAssigneeId(e.target.value || null)}
                                className="w-32 p-3 bg-white rounded-xl shadow-sm outline-none text-sm"
                            >
                                <option value="">An...</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.display_name}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                className="w-36 p-3 bg-white rounded-xl shadow-sm outline-none text-sm text-gray-700"
                                value={newTaskDueDate}
                                onChange={(e) => setNewTaskDueDate(e.target.value)}
                            />
                            <select
                                value={newTaskReminder}
                                onChange={(e) => setNewTaskReminder(e.target.value as ReminderMinutes)}
                                className="w-36 p-3 bg-white rounded-xl shadow-sm outline-none text-sm"
                            >
                                <option value="">Keine Erinnerung</option>
                                <option value="15">15 Min vorher</option>
                                <option value="60">1 Std vorher</option>
                                <option value="1440">1 Tag vorher</option>
                                <option value="4320">3 Tage vorher</option>
                            </select>
                            <button type="submit" className="bg-mw-green text-white px-4 py-3 rounded-xl shadow-sm hover:bg-mw-green-dark transition">
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    {filteredTasks.length === 0 ? (
                        <p className="text-sm text-center text-gray-400 mt-8 italic">Keine Aufgaben gefunden.</p>
                    ) : (
                        filteredTasks.map((task) => (
                            <div key={task.id} className={`p-4 rounded-xl border transition-all ${task.completed ? "bg-gray-50 opacity-60" : "bg-white hover:border-mw-green/30 shadow-sm"}`}>
                                {editingTaskId === task.id ? (
                                    <form onSubmit={handleUpdateTask} className="flex flex-col gap-3">
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                                            value={editTaskTitle}
                                            onChange={(e) => setEditTaskTitle(e.target.value)}
                                            required
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            <select
                                                value={editTaskCaseId ?? ""}
                                                onChange={(e) => setEditTaskCaseId(e.target.value || null)}
                                                className="w-36 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                            >
                                                <option value="">Fall (optional)</option>
                                                {cases.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={editTaskAssigneeId ?? ""}
                                                onChange={(e) => setEditTaskAssigneeId(e.target.value || null)}
                                                className="w-32 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                            >
                                                <option value="">An...</option>
                                                {employees.map((emp) => (
                                                    <option key={emp.id} value={emp.id}>{emp.display_name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="date"
                                                className="w-36 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                                value={editTaskDueDate}
                                                onChange={(e) => setEditTaskDueDate(e.target.value)}
                                            />
                                            <select
                                                value={editTaskReminder}
                                                onChange={(e) => setEditTaskReminder(e.target.value as ReminderMinutes)}
                                                className="w-36 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                            >
                                                <option value="">Keine Erinnerung</option>
                                                <option value="15">15 Min vorher</option>
                                                <option value="60">1 Std vorher</option>
                                                <option value="1440">1 Tag vorher</option>
                                                <option value="4320">3 Tage vorher</option>
                                            </select>
                                        </div>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editTaskCompleted}
                                                onChange={(e) => setEditTaskCompleted(e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                            Erledigt
                                        </label>
                                        <div className="flex gap-2">
                                            <button type="submit" className="flex-1 bg-mw-green text-white p-2.5 rounded-xl text-sm font-medium hover:bg-mw-green-dark">
                                                Speichern
                                            </button>
                                            <button type="button" onClick={cancelEditTask} className="p-2.5 text-gray-500 hover:text-gray-700 rounded-xl border border-gray-200">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div
                                                onClick={() => toggleTask(task)}
                                                className={`cursor-pointer w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-mw-green"
                                                    }`}
                                            >
                                                {task.completed && <CheckCircle size={14} className="text-white" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}>{task.title}</span>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            {task.caseId && getCaseDisplayLabel(task.caseId) && (
                                                <span className="text-[10px] bg-mw-green/10 text-mw-green px-2 py-0.5 rounded-md font-medium">
                                                    {getCaseDisplayLabel(task.caseId)}
                                                </span>
                                            )}
                                                    {(task.assigneeId ? employees.find((e) => e.id === task.assigneeId)?.display_name : task.assignee) !== "Alle" && (
                                                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-md font-bold text-gray-600">
                                                            {task.assigneeId ? employees.find((e) => e.id === task.assigneeId)?.display_name ?? task.assignee : task.assignee}
                                                        </span>
                                                    )}
                                                    {task.dueDate && (
                                                        <span className={`text-[10px] font-medium flex items-center gap-1 ${new Date(task.dueDate) < new Date() && !task.completed ? "text-red-500" : "text-gray-500"}`}>
                                                            <Clock size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => startEditTask(task)}
                                                className="p-2 text-gray-300 hover:text-mw-green opacity-0 group-hover:opacity-100 transition"
                                                title="Bearbeiten"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                title="Löschen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
            )}

            {/* Lager-Zuordnungen – immer sichtbar */}
            <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-serif text-mw-green flex items-center gap-2 shrink-0">
                        <Package size={20} className="shrink-0" /> Lager – Zugewiesene Gegenstände
                    </h3>
                    <Link
                        href="/admin/leistungen/lager"
                        className="text-sm text-mw-green hover:text-mw-green-dark font-medium shrink-0"
                    >
                        Zum Lager →
                    </Link>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                    {viewMode === "list" && (
                        <form onSubmit={handleAssignItem} className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-3 sm:items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="min-w-0 flex-1 sm:flex-initial sm:w-48">
                                <label className="block text-xs text-gray-500 mb-1">Gegenstand</label>
                                <select
                                    value={assignItemId ?? ""}
                                    onChange={(e) => setAssignItemId(e.target.value || null)}
                                    className="w-full sm:w-48 p-2.5 bg-white border border-gray-200 rounded-xl text-sm min-w-0"
                                    required
                                >
                                    <option value="">Auswählen...</option>
                                    {allItems
                                        .filter((i) => !i.caseId)
                                        .map((i) => (
                                            <option key={i.id} value={i.id}>{i.title} {i.sequentialId ? `(${i.sequentialId})` : ""}</option>
                                        ))}
                                </select>
                            </div>
                            <div className="min-w-0 flex-1 sm:flex-initial sm:w-48">
                                <label className="block text-xs text-gray-500 mb-1">Fall</label>
                                <select
                                    value={assignCaseId ?? ""}
                                    onChange={(e) => setAssignCaseId(e.target.value || null)}
                                    className="w-full sm:w-48 p-2.5 bg-white border border-gray-200 rounded-xl text-sm min-w-0"
                                    required
                                >
                                    <option value="">Auswählen...</option>
                                    {cases.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-0 flex-1 sm:flex-initial sm:w-36">
                                <label className="block text-xs text-gray-500 mb-1">Status</label>
                                <select
                                    value={assignStatus}
                                    onChange={(e) => setAssignStatus(e.target.value as "reserved" | "assigned" | "delivered")}
                                    className="w-full sm:w-36 p-2.5 bg-white border border-gray-200 rounded-xl text-sm min-w-0"
                                >
                                    <option value="reserved">Reserviert</option>
                                    <option value="assigned">Zugewiesen</option>
                                    <option value="delivered">Geliefert</option>
                                </select>
                            </div>
                            <button type="submit" className="bg-mw-green text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mw-green-dark shrink-0 w-full sm:w-auto">
                                Zuweisen
                            </button>
                        </form>
                    )}
                    {assignedItems.length === 0 ? (
                        <p className="text-sm text-gray-400 italic pt-1">Keine Gegenstände einem Fall zugeordnet.</p>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {assignedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex justify-between items-start gap-2 group"
                                >
                                    <div>
                                        <p className="font-medium text-sm text-gray-800">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.caseId && getCaseName(item.caseId)}
                                        </p>
                                        {item.deliveryStatus && (
                                            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md ${
                                                item.deliveryStatus === "delivered" ? "bg-green-100 text-green-800" :
                                                item.deliveryStatus === "assigned" ? "bg-amber-100 text-amber-800" :
                                                "bg-blue-100 text-blue-800"
                                            }`}>
                                                {item.deliveryStatus === "reserved" ? "Reserviert" : item.deliveryStatus === "assigned" ? "Zugewiesen" : "Geliefert"}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {onOpenCase && item.caseId && (
                                            <button
                                                type="button"
                                                onClick={() => onOpenCase(item.caseId!)}
                                                className="text-xs text-mw-green hover:text-mw-green-dark font-medium"
                                            >
                                                Zum Fall
                                            </button>
                                        )}
                                        {viewMode === "list" && (
                                            <button
                                                type="button"
                                                onClick={() => handleUnassignItem(item.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                title="Zuordnung aufheben"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
