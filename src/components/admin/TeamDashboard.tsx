"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Plus, CheckCircle, Trash2, Clock, List, Calendar } from "lucide-react";
import { Appointment, Task } from "@/types";
import { supabase } from "@/lib/supabase";
import type { Employee } from "@/app/actions/employees";
import { CalendarView } from "./CalendarView";

type ViewMode = "list" | "calendar";

export function TeamDashboard({ taskFilter, employees }: { taskFilter: string; employees: Employee[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string | null>(null);
    const [newTaskDueDate, setNewTaskDueDate] = useState("");

    const [newApptTitle, setNewApptTitle] = useState("");
    const [newApptDate, setNewApptDate] = useState("");

    const fetchData = useCallback(async () => {
        const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (taskData) {
            setTasks(taskData.map((t: any) => ({
                id: t.id,
                title: t.title,
                assignee: t.assignee ?? "Alle",
                assigneeId: t.assignee_id,
                dueDate: t.due_date,
                completed: t.completed,
                createdAt: t.created_at
            })));
        }

        // Fetch appointments
        const { data: apptData } = await supabase
            .from('appointments')
            .select('*')
            .order('appointment_date', { ascending: true });

        if (apptData) {
            setAppointments(apptData.map((a: any) => ({
                id: a.id,
                title: a.title,
                date: a.appointment_date,
                createdAt: a.created_at
            })));
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Listen for global refresh events
        const handleRefresh = () => fetchData();
        window.addEventListener('fetch-cases', handleRefresh);
        return () => window.removeEventListener('fetch-cases', handleRefresh);
    }, [fetchData]);

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
            completed: false
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
            appointment_date: newApptDate
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

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            {/* View Switcher */}
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

            {viewMode === "calendar" ? (
                <CalendarView appointments={appointments} tasks={filteredTasks} />
            ) : (
        <div className="grid lg:grid-cols-12 gap-8 h-[80vh]">
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
                            <div key={appt.id} className="p-3 rounded-xl border bg-white flex justify-between items-center group">
                                <div>
                                    <div className="text-xs font-bold text-mw-green-light mb-1">
                                        {new Date(appt.date).toLocaleDateString("de-DE")} - {new Date(appt.date).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                                    </div>
                                    <h5 className="font-medium text-sm">{appt.title}</h5>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (confirm("Termin löschen?")) {
                                            await supabase.from('appointments').delete().eq('id', appt.id);
                                            fetchData();
                                        }
                                    }}
                                    className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Trash2 size={14} />
                                </button>
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
                        <div className="flex gap-2">
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
                            <div key={task.id} className={`flex items-center justify-between p-4 rounded-xl border group transition-all ${task.completed ? "bg-gray-50 opacity-60" : "bg-white hover:border-mw-green/30 shadow-sm"}`}>
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
                                        <div className="flex items-center gap-3 mt-1">
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
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
            )}
        </div>
    );
}
