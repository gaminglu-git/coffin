import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { GripVertical, Clock, Trash2, Key } from "lucide-react";
import {
    DndContext,
    useDroppable,
    useDraggable,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    DragOverEvent,
    closestCorners,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Case, CaseStatus } from "@/types";
import { CaseDetailModal } from "@/components/admin/CaseDetailModal";
import { supabase } from "@/lib/supabase";

const KANBAN_COLUMNS: { id: CaseStatus; title: string; color: string }[] = [
    { id: "Neu", title: "Neu / Erstkontakt", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { id: "In Planung", title: "In Planung", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { id: "Behörden & Orga", title: "Behörden & Orga", color: "bg-orange-100 text-orange-800 border-orange-200" },
    { id: "Trauerfeier", title: "Trauerfeier", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { id: "Abgeschlossen", title: "Abgeschlossen", color: "bg-green-100 text-green-800 border-green-200" },
];

const KanbanCard = memo(({ c, onClick, onDelete, isDragging, listeners, attributes, style }: { c: Case; onClick: () => void; onDelete: () => void; isDragging?: boolean; listeners?: any; attributes?: any; style?: any }) => {
    const isVorsorge = c.name.startsWith("VORSORGE:");

    return (
        <div
            onClick={onClick}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all relative group touch-none ${isVorsorge ? "border-blue-300 bg-blue-50/30" : "border-gray-200 hover:border-[#4a554e]/50"
                } ${isDragging ? "opacity-50 grayscale-[0.5] scale-95 z-50" : ""}`}
        >
            <div className="absolute top-2 right-2 sm:opacity-0 group-hover:opacity-100 transition">
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Endgültig löschen?")) {
                            await supabase.from('cases').delete().eq('id', c.id);
                            onDelete();
                        }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="flex items-start gap-2 mb-2">
                <GripVertical size={16} className="text-gray-300 mt-0.5" />
                <h4 className={`font-medium pr-6 ${isVorsorge ? "text-blue-800" : "text-gray-800"}`}>{c.name}</h4>
            </div>
            <div className="ml-6 mb-3">
                <span className={`${isVorsorge ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"} text-[10px] px-2 py-0.5 rounded border`}>
                    {c.wishes?.burialType || "Unklar"}
                </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 ml-6">
                <span className="flex items-center gap-1">
                    <Clock size={12} /> {new Date(c.createdAt).toLocaleDateString("de-DE")}
                </span>
                {c.familyPin && (
                    <span className="flex items-center gap-1 font-mono text-[10px] bg-gray-50 px-1 py-0.5 rounded border">
                        <Key size={10} /> {c.familyPin}
                    </span>
                )}
            </div>
        </div>
    );
});

KanbanCard.displayName = "KanbanCard";

function SortableCaseItem({ c, onClick, onDelete }: { c: Case; onClick: () => void; onDelete: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: c.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef}>
            <KanbanCard
                c={c}
                onClick={onClick}
                onDelete={onDelete}
                isDragging={isDragging}
                listeners={listeners}
                attributes={attributes}
                style={style}
            />
        </div>
    );
}

function DroppableColumn({ column, cases, onCaseClick, onDelete }: { column: typeof KANBAN_COLUMNS[0], cases: Case[], onCaseClick: (id: string) => void, onDelete: () => void }) {
    const { setNodeRef } = useDroppable({ id: column.id });

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col rounded-2xl min-w-[320px] max-w-[320px] max-h-full bg-gray-200/50"
        >
            <div className={`p-3 m-2 rounded-xl border ${column.color} font-medium flex justify-between uppercase text-[10px] tracking-widest`}>
                <span>{column.title}</span>
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">{cases.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
                <SortableContext items={cases.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cases.map((c) => (
                        <SortableCaseItem key={c.id} c={c} onClick={() => onCaseClick(c.id)} onDelete={onDelete} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

export function KanbanBoard() {
    const [cases, setCases] = useState<Case[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    const fetchCases = useCallback(async () => {
        // Sort by position primarily
        const { data } = await supabase
            .from('cases')
            .select('*')
            .order('position', { ascending: true })
            .order('created_at', { ascending: false });

        if (data) {
            setCases(data.map((c: any) => ({
                id: c.id,
                name: c.name,
                status: c.status as CaseStatus,
                createdAt: c.created_at,
                familyPin: c.family_pin,
                wishes: c.wishes,
                deceased: c.deceased,
                contact: c.contact,
                checklists: c.checklists,
                notes: [],
                memories: [],
                position: c.position || 0,
                postCareGenerated: c.post_care_generated
            })));
        }
    }, []);

    useEffect(() => {
        fetchCases();
        const handleFetch = () => fetchCases();
        window.addEventListener('fetch-cases', handleFetch);
        return () => window.removeEventListener('fetch-cases', handleFetch);
    }, [fetchCases]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeIdStr = active.id as string;
        const overIdStr = over.id as string;

        const activeCase = cases.find(c => c.id === activeIdStr);
        const overCase = cases.find(c => c.id === overIdStr);

        if (!activeCase || !activeCase.status) return;

        // If dragging over a column
        const overColumn = KANBAN_COLUMNS.find(col => col.id === overIdStr);

        if (overColumn && activeCase.status !== overColumn.id) {
            setCases(prev => prev.map(c =>
                c.id === activeIdStr ? { ...c, status: overColumn.id as CaseStatus } : c
            ));
            return;
        }

        // If dragging over another card in a different column
        if (overCase && activeCase.status !== overCase.status) {
            setCases(prev => prev.map(c =>
                c.id === activeIdStr ? { ...c, status: overCase.status } : c
            ));
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeIdStr = active.id as string;
        const overIdStr = over.id as string;

        const activeItem = cases.find(c => c.id === activeIdStr);
        if (!activeItem) return;

        const overItem = cases.find(c => c.id === overIdStr);

        let newStatus = activeItem.status;
        let newPosition = activeItem.position;

        // Find items in the target column to calculate position
        const columnItems = cases
            .filter(c => c.status === (overItem ? overItem.status : (overIdStr as CaseStatus)))
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        if (overItem) {
            newStatus = overItem.status;
            const oldIndex = cases.indexOf(activeItem);
            const newIndex = cases.indexOf(overItem);

            if (activeIdStr !== overIdStr) {
                const overIdxInCol = columnItems.findIndex(c => c.id === overIdStr);

                if (overIdxInCol === 0) {
                    newPosition = (columnItems[0].position || 0) - 1000;
                } else if (overIdxInCol === columnItems.length - 1) {
                    newPosition = (columnItems[columnItems.length - 1].position || 0) + 1000;
                } else {
                    newPosition = ((columnItems[overIdxInCol - 1].position || 0) + (columnItems[overIdxInCol].position || 0)) / 2;
                }

                setCases((prev) => arrayMove(prev, oldIndex, newIndex).map(c =>
                    c.id === activeIdStr ? { ...c, status: newStatus, position: newPosition } : c
                ));
            }
        } else {
            // Dragged to empty column
            newStatus = overIdStr as CaseStatus;
            newPosition = 1000;
            setCases(prev => prev.map(c =>
                c.id === activeIdStr ? { ...c, status: newStatus, position: newPosition } : c
            ));
        }

        // Persist to Supabase
        const { error } = await supabase
            .from('cases')
            .update({
                status: newStatus,
                position: newPosition
                // Note: removed updated_at as it's handled by DB
            })
            .eq('id', activeIdStr);

        if (error) {
            console.error("Failed to update position:", error);
            fetchCases(); // Rollback
        } else if (newStatus === 'Abgeschlossen' && !activeItem.postCareGenerated) {
            // AUTOMATED POST-FUNERAL CARE (Nachsorge)
            // Extract family name: prefer contact lastName, fallback to deceased lastName, then fallback to case name part
            const familyName = activeItem.contact?.lastName ||
                activeItem.deceased?.lastName ||
                activeItem.name.split(',')[0].trim().replace("VORSORGE:", "").trim();

            const now = new Date();

            // Task 1: 6-Week Check-in (42 days)
            const date6Weeks = new Date(now);
            date6Weeks.setDate(now.getDate() + 42);
            const dueDate6Weeks = date6Weeks.toISOString().split('T')[0];

            // Task 2: 1-Year Anniversary (365 days)
            const date1Year = new Date(now);
            date1Year.setDate(now.getDate() + 365);
            const dueDate1Year = date1Year.toISOString().split('T')[0];

            const newTasks = [
                {
                    case_id: activeIdStr,
                    title: `Nachsorge: Familie ${familyName} anrufen (Wie geht es Ihnen?)`,
                    assignee: "Alle",
                    completed: false,
                    due_date: dueDate6Weeks
                },
                {
                    case_id: activeIdStr,
                    title: `Todestag: Gedenkkarte an Familie ${familyName} senden`,
                    assignee: "Alle",
                    completed: false,
                    due_date: dueDate1Year
                }
            ];

            const { error: taskError } = await supabase.from('tasks').insert(newTasks);

            if (!taskError) {
                // Mark post care as generated in DB and state
                await supabase.from('cases').update({ post_care_generated: true }).eq('id', activeIdStr);
                setCases(prev => prev.map(c => c.id === activeIdStr ? { ...c, postCareGenerated: true } : c));
            } else {
                console.error("Failed to generate post-care tasks:", taskError);
            }
        }
    };

    const activeCase = useMemo(() => cases.find(c => c.id === activeId), [activeId, cases]);

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6 h-full items-start overflow-x-auto pb-4 scrollbar-hide">
                    {KANBAN_COLUMNS.map((col) => (
                        <DroppableColumn
                            key={col.id}
                            column={col}
                            cases={cases
                                .filter((c) => c.status === col.id)
                                .sort((a, b) => (a.position || 0) - (b.position || 0))
                            }
                            onCaseClick={setActiveCaseId}
                            onDelete={fetchCases}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.5',
                            },
                        },
                    }),
                }}>
                    {activeId && activeCase ? (
                        <div className="w-[304px] rotate-2 shadow-2xl">
                            <KanbanCard
                                c={activeCase}
                                onClick={() => { }}
                                onDelete={() => { }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
            <CaseDetailModal activeCaseId={activeCaseId} onClose={() => setActiveCaseId(null)} />
        </>
    );
}
