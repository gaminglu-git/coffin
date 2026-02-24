export const queryKeys = {
  tasks: ["tasks"] as const,
  appointments: ["appointments"] as const,
  cases: (filter?: string) => (filter ? ["cases", filter] as const : ["cases"] as const),
  casesList: ["cases", "list"] as const,
  inventory: (filters?: { assignedOnly?: boolean }) => ["inventory", filters] as const,
  timeEntries: (employeeId: string | null, from: Date, to: Date) =>
    ["timeEntries", employeeId ?? "all", from.toISOString(), to.toISOString()] as const,
  events: (from: Date, to: Date) =>
    ["events", from.toISOString(), to.toISOString()] as const,
  eventsList: ["events", "list"] as const,
  publicEvents: ["events", "public"] as const,
} as const;
