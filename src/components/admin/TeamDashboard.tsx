"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, Plus, CheckCircle, Trash2, Clock, List, Calendar, Pencil, X, Package } from "lucide-react";
import { Appointment, Task, InventoryItem } from "@/types";
import { supabase } from "@/lib/supabase";
import { getInventoryItems, assignInventoryItemToCaseAction } from "@/app/actions/inventory";
import type { Employee } from "@/app/actions/employees";
import { getTimeEntries } from "@/app/actions/time-entries";
import type { TimeEntryEvent } from "@/app/actions/time-entries";
import { CalendarView } from "./CalendarView";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

type ViewMode = "list" | "calendar";

interface TeamDashboardProps {
    taskFilter: string;
    employees: Employee[];
    onOpenCase?: (caseId: string) => void;
}

export function TeamDashboard({ taskFilter, employees, onOpenCase }: TeamDashboardProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [cases, setCases] = useState<{ id: string; name: string; contact?: { firstName?: string; lastName?: string } }[]>([]);

    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string | null>(null);
    const [newTaskDueDate, setNewTaskDueDate] = useState("");
    const [newTaskCaseId, setNewTaskCaseId] = useState<string | null>(null);

    const [newApptTitle, setNewApptTitle] = useState("");
    const [newApptDate, setNewApptDate] = useState("");
    const [newApptCaseId, setNewApptCaseId] = useState<string | null>(null);

    const [editingApptId, setEditingApptId] = useState<string | null>(null);
    const [editApptTitle, setEditApptTitle] = useState("");
    const [editApptDate, setEditApptDate] = useState("");
    const [editApptCaseId, setEditApptCaseId] = useState<string | null>(null);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState("");
    const [editTaskDueDate, setEditTaskDueDate] = useState("");
    const [editTaskAssigneeId, setEditTaskAssigneeId] = useState<string | null>(null);
    const [editTaskCaseId, setEditTaskCaseId] = useState<string | null>(null);
    const [editTaskCompleted, setEditTaskCompleted] = useState(false);

    const [assignedItems, setAssignedItems] = useState<InventoryItem[]>([]);
    const [allItems, setAllItems] = useState<InventoryItem[]>([]);
    const [assignItemId, setAssignItemId] = useState<string | null>(null);
    const [assignCaseId, setAssignCaseId] = useState<string | null>(null);
    const [assignStatus, setAssignStatus] = useState<"reserved" | "assigned" | "delivered">("assigned");

    const [timeEntries, setTimeEntries] = useState<TimeEntryEvent[]>([]);
    const [showTimeEntries, setShowTimeEntries] = useState(true);

    const fetchData = useCallback(async () => {
        const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (taskData) {
            setTasks(taskData.map((t: { id: string; title: string; assignee?: string; assignee_id?: string | null; due_date?: string | null; completed?: boolean; created_at: string; case_id?: string | null }) => ({
                id: t.id,
                title: t.title,
                assignee: t.assignee ?? "Alle",
                assigneeId: t.assignee_id ?? null,
                dueDate: t.due_date ?? null,
                completed: t.completed ?? false,
                createdAt: t.created_at,
                caseId: t.case_id ?? null
            })));
        }

        // Fetch appointments
        const { data: apptData } = await supabase
            .from('appointments')
            .select('*')
            .order('appointment_date', { ascending: true });

        if (apptData) {
            setAppointments(apptData.map((a: { id: string; title: string; appointment_date: string; created_at: string; case_id?: string | null }) => ({
                id: a.id,
                title: a.title,
                date: a.appointment_date,
                createdAt: a.created_at,
                caseId: a.case_id ?? null
            })));
        }

        // Fetch cases for optional case linking (incl. contact for Verbliebene-Anzeige)
        const { data: caseData } = await supabase.from('cases').select('id, name, contact').order('name');
        setCases((caseData ?? []).map((c: { id: string; name: string; contact?: { firstName?: string; lastName?: string } }) => ({
            id: c.id,
            name: c.name,
            contact: c.contact ?? undefined
        })));

        // Fetch inventory items
        try {
            const [assigned, all] = await Promise.all([
                getInventoryItems({ assignedOnly: true }),
                getInventoryItems(),
            ]);
            setAssignedItems(assigned);
            setAllItems(all);
        } catch {
            setAssignedItems([]);
            setAllItems([]);
        }

    }, []);

    const fetchTimeEntries = useCallback(async () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        const entries = await getTimeEntries(taskFilter === "Alle" ? null : taskFilter, from, to);
        setTimeEntries(entries);
    }, [taskFilter]);

    useEffect(() => {
        fetchData();
        // Listen for global refresh events
        const handleRefresh = () => fetchData();
        window.addEventListener('fetch-cases', handleRefresh);
        return () => window.removeEventListener('fetch-cases', handleRefresh);
    }, [fetchData]);

    useRealtimeTable({ table: "tasks" }, fetchData);
    useRealtimeTable({ table: "appointments" }, fetchData);
    useRealtimeTable({ table: "cases" }, fetchData);
    useRealtimeTable({ table: "inventory_items" }, fetchData);
    useRealtimeTable({ table: "employee_time_entries" }, fetchTimeEntries);

    useEffect(() => {
        fetchTimeEntries();
    }, [fetchTimeEntries]);

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
            case_id: newTaskCaseId || null
        };

        const { error } = await supabase.from('tasks').insert(newTask);
        if (!error) {
            fetchData();
            setNewTaskTitle("");
            setNewTaskDueDate("");
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
            case_id: newApptCaseId || null
        };

        const { error } = await supabase.from('appointments').insert(newAppt);
        if (!error) {
            fetchData();
            setNewApptTitle("");
            setNewApptDate("");
        } else {
            console.error("Failed to add appointment:", error);
        }
    };

    const startEditAppointment = (appt: Appointment) => {
        setEditingApptId(appt.id);
        setEditApptTitle(appt.title);
        setEditApptDate(appt.date.slice(0, 16));
        setEditApptCaseId(appt.caseId ?? null);
    };

    const cancelEditAppointment = () => {
        setEditingApptId(null);
        setEditApptTitle("");
        setEditApptDate("");
        setEditApptCaseId(null);
    };

    const handleUpdateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingApptId || !editApptTitle || !editApptDate) return;

        const { error } = await supabase
            .from('appointments')
            .update({
                title: editApptTitle,
                appointment_date: editApptDate,
                case_id: editApptCaseId || null
            })
            .eq('id', editingApptId);

        if (!error) {
            fetchData();
            cancelEditAppointment();
        } else {
            console.error("Failed to update appointment:", error);
        }
    };

    const deleteAppointment = async (id: string) => {
        if (!confirm("Termin löschen?")) return;
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (!error) fetchData();
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
            setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
        }
    };

    const deleteTask = async (id: string) => {
        if (!confirm("Aufgabe wirklich löschen?")) return;
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (!error) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    const startEditTask = (task: Task) => {
        setEditingTaskId(task.id);
        setEditTaskTitle(task.title);
        setEditTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
        setEditTaskAssigneeId(task.assigneeId ?? null);
        setEditTaskCaseId(task.caseId ?? null);
        setEditTaskCompleted(task.completed);
    };

    const cancelEditTask = () => {
        setEditingTaskId(null);
        setEditTaskTitle("");
        setEditTaskDueDate("");
        setEditTaskAssigneeId(null);
        setEditTaskCaseId(null);
        setEditTaskCompleted(false);
    };

    const handleAssignItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignItemId || !assignCaseId) return;
        const result = await assignInventoryItemToCaseAction(assignItemId, assignCaseId, assignStatus);
        if (result.success) {
            fetchData();
            setAssignItemId(null);
            setAssignCaseId(null);
        } else {
            console.error("Assign failed:", result.error);
        }
    };

    const handleUnassignItem = async (itemId: string) => {
        if (!confirm("Gegenstand von Fall trennen?")) return;
        const result = await assignInventoryItemToCaseAction(itemId, null);
        if (result.success) fetchData();
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
                completed: editTaskCompleted
            })
            .eq('id', editingTaskId);

        if (!error) {
            fetchData();
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
                />
            ) : (
        <div className="grid lg:grid-cols-12 gap-8 h-[70vh]">
            {/* Agenda */}
            <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-serif text-mw-green flex items-center gap-2 mb-4">
                        <CalendarDays size={20} /> Agenda
                    </h3>
                    <form onSubmit={handleAddAppointment} className="flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Neuer Termin..."
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                            value={newApptTitle}
                            onChange={(e) => setNewApptTitle(e.target.value)}
                            required
                        />
                        <select
                            value={newApptCaseId ?? ""}
                            onChange={(e) => setNewApptCaseId(e.target.value || null)}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                        >
                            <option value="">Fall (optional)</option>
                            {cases.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <input
                                type="datetime-local"
                                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                value={newApptDate}
                                onChange={(e) => setNewApptDate(e.target.value)}
                                required
                            />
                            <button type="submit" className="bg-mw-green text-white p-2.5 rounded-xl transition hover:bg-mw-green-dark">
                                <Plus size={18} />
                            </button>
                        </div>
                    </form>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {appointments.length === 0 ? (
                        <p className="text-sm text-center text-gray-400 mt-8 italic">Keine anstehenden Termine.</p>
                    ) : (
                        appointments.map((appt) => (
                            <div key={appt.id} className="p-3 rounded-xl border bg-white">
                                {editingApptId === appt.id ? (
                                    <form onSubmit={handleUpdateAppointment} className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm"
                                            value={editApptTitle}
                                            onChange={(e) => setEditApptTitle(e.target.value)}
                                            required
                                        />
                                        <select
                                            value={editApptCaseId ?? ""}
                                            onChange={(e) => setEditApptCaseId(e.target.value || null)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                        >
                                            <option value="">Fall (optional)</option>
                                            {cases.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="datetime-local"
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                            value={editApptDate}
                                            onChange={(e) => setEditApptDate(e.target.value)}
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <button type="submit" className="flex-1 bg-mw-green text-white p-2 rounded-xl text-sm font-medium hover:bg-mw-green-dark">
                                                Speichern
                                            </button>
                                            <button type="button" onClick={cancelEditAppointment} className="p-2 text-gray-500 hover:text-gray-700 rounded-xl border border-gray-200">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex justify-between items-center group">
                                        <div>
                                            <div className="text-xs font-bold text-mw-green-light mb-1">
                                                {new Date(appt.date).toLocaleDateString("de-DE")} - {new Date(appt.date).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                                            </div>
                                            <h5 className="font-medium text-sm">{appt.title}</h5>
                                            {appt.caseId && getCaseDisplayLabel(appt.caseId) && (
                                                <span className="text-[10px] text-gray-500 mt-0.5 block">{getCaseDisplayLabel(appt.caseId)}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => startEditAppointment(appt)}
                                                className="p-1.5 text-gray-300 hover:text-mw-green opacity-0 group-hover:opacity-100 transition"
                                                title="Bearbeiten"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => deleteAppointment(appt.id)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                title="Löschen"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Task List */}
            <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-serif text-mw-green flex items-center gap-2 mb-4">
                        <CheckCircle size={20} /> To-Do Liste
                    </h3>
                    <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                        <input
                            type="text"
                            placeholder="Aufgabe eingeben..."
                            className="flex-1 p-3 bg-white rounded-xl shadow-sm outline-none text-sm"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            required
                        />
                        <div className="flex flex-wrap gap-2">
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
            <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-xl font-serif text-mw-green flex items-center gap-2">
                        <Package size={20} /> Lager – Zugewiesene Gegenstände
                    </h3>
                    <Link
                        href="/admin/inventory"
                        className="text-sm text-mw-green hover:text-mw-green-dark font-medium"
                    >
                        Zum Lager →
                    </Link>
                </div>
                <div className="p-6 space-y-4">
                    {viewMode === "list" && (
                        <form onSubmit={handleAssignItem} className="flex flex-wrap gap-2 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Gegenstand</label>
                                <select
                                    value={assignItemId ?? ""}
                                    onChange={(e) => setAssignItemId(e.target.value || null)}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm w-48"
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
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Fall</label>
                                <select
                                    value={assignCaseId ?? ""}
                                    onChange={(e) => setAssignCaseId(e.target.value || null)}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm w-48"
                                    required
                                >
                                    <option value="">Auswählen...</option>
                                    {cases.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Status</label>
                                <select
                                    value={assignStatus}
                                    onChange={(e) => setAssignStatus(e.target.value as "reserved" | "assigned" | "delivered")}
                                    className="p-2.5 bg-white border border-gray-200 rounded-xl text-sm w-36"
                                >
                                    <option value="reserved">Reserviert</option>
                                    <option value="assigned">Zugewiesen</option>
                                    <option value="delivered">Geliefert</option>
                                </select>
                            </div>
                            <button type="submit" className="bg-mw-green text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mw-green-dark">
                                Zuweisen
                            </button>
                        </form>
                    )}
                    {assignedItems.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Keine Gegenstände einem Fall zugeordnet.</p>
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
