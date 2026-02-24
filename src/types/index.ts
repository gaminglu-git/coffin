export type CaseStatus = 'Neu' | 'In Planung' | 'Behörden & Orga' | 'Trauerfeier' | 'Abgeschlossen';

export type CaseType = 'vorsorge' | 'trauerfall' | 'beratung' | 'sonstiges';

export interface Case {
    id: string; // From Supabase
    name: string;
    status: CaseStatus;
    createdAt: string;
    familyPin: string;
    deceased: {
        firstName: string;
        lastName: string;
        birthDate: string;
        deathDate: string;
        deathPlace: string;
        religion: string;
        maritalStatus: string;
        address: string;
    };
    contact: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        relation: string;
        address: string;
    };
    wishes: {
        burialType: string;
        specialWishes: string;
    };
    checklists: {
        title: string;
        items: {
            text: string;
            completed: boolean;
        }[];
    }[];
    notes: {
        id: string;
        text: string;
        author: string;
        createdAt: string;
    }[];
    memories: {
        id: string;
        text: string;
        createdAt: string;
    }[];
    familyPhotos?: {
        id: string;
        storagePath: string;
        url?: string;
        uploadedByName: string;
        caption?: string | null;
        createdAt: string;
    }[];
    files?: {
        id: string;
        name: string;
        url: string;
        type: 'document' | 'photo' | 'video';
        uploadedBy: 'family' | 'admin';
        createdAt: string;
    }[];
    position?: number;
    postCareGenerated?: boolean;
    caseType?: CaseType;
}

export interface Task {
    id: string;
    title: string;
    assignee: string;
    assigneeId?: string | null;
    dueDate: string | null;
    completed: boolean;
    createdAt: string;
    caseId?: string | null;
    reminderAt?: string | null;
}

export interface Appointment {
    id: string;
    title: string;
    date: string;
    endAt?: string | null;
    createdAt: string;
    caseId?: string | null;
    assigneeId?: string | null;
    assignee?: string;
    reminderAt?: string | null;
}

export type EventRecurrenceType = "none" | "weekly" | "monthly" | "monthly_nth";

export interface EventRecurrenceConfig {
    weekday?: number; // 1=Mon, 7=Sun
    weekOfMonth?: number; // 1-5
}

export interface Event {
    id: string;
    name: string;
    description: string | null;
    startAt: string;
    endAt: string;
    location: string | null;
    isPublic: boolean;
    recurrenceType: EventRecurrenceType;
    recurrenceConfig: EventRecurrenceConfig;
    recurrenceUntil: string | null;
    createdAt: string;
    updatedAt: string;
}

// Correspondence = Kontakt (Person oder Firma) – Adressbuch
export type CorrespondenceKind = 'person' | 'company';

export interface Correspondence {
    id: string;
    caseId: string | null;
    kind: CorrespondenceKind;
    displayName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    companyName?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

// Communication = Eingehende/ausgehende Nachricht
export type CommunicationType = 'email' | 'letter' | 'phone' | 'other';
export type CommunicationDirection = 'incoming' | 'outgoing';

export interface Communication {
    id: string;
    correspondenceId?: string | null;
    caseId: string;
    employeeId?: string | null;
    taskId?: string | null;
    appointmentId?: string | null;
    type: CommunicationType;
    direction: CommunicationDirection;
    subject?: string | null;
    content?: string | null;
    storagePath?: string | null;
    createdAt: string;
}

export interface LetterTemplate {
    id: string;
    name: string;
    subject: string | null;
    body: string;
    createdAt: string;
    updatedAt: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChecklistTemplate {
    id: string;
    name: string;
    burialType: string | null;
    items: { title: string; items: { text: string }[] }[];
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    text: string;
    author: string;
    createdAt: string;
}

export interface FamilyPhoto {
    id: string;
    caseId: string;
    storagePath: string;
    uploadedByName: string;
    caption?: string | null;
    createdAt: string;
}

// Inventory (Shelf.nu-inspired)
export type InventoryItemStatus = 'in_stock' | 'in_use' | 'checked_out';

export interface InventoryCategory {
    id: string;
    name: string;
    description: string | null;
    color: string;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryLocation {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export type DeliveryStatus = 'reserved' | 'assigned' | 'delivered' | null;

export interface InventoryItem {
    id: string;
    title: string;
    description: string | null;
    status: InventoryItemStatus;
    sequentialId: string | null;
    categoryId: string | null;
    locationId: string | null;
    caseId?: string | null;
    assignedAt?: string | null;
    deliveryStatus?: DeliveryStatus;
    priceCents?: number | null;
    imageStoragePath?: string | null;
    parameters?: Record<string, string | number | boolean>;
    createdAt: string;
    updatedAt: string;
    category?: InventoryCategory | null;
    location?: InventoryLocation | null;
    qrCodes?: QrCode[];
}

// Leistungen (services for Vorsorge configurator)
export type LeistungType =
  | "bestattungsart"
  | "ausstattung_sarg"
  | "ausstattung_urne"
  | "rahmen"
  | "sonstiges";

export type LeistungPriceType = "fixed" | "per_unit" | "min_price" | "on_request";

export interface LeistungCategory {
    id: string;
    name: string;
    description: string | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface Leistung {
    id: string;
    title: string;
    description: string | null;
    priceCents: number;
    priceType?: LeistungPriceType;
    unitLabel?: string | null;
    parentId?: string | null;
    imageStoragePath: string | null;
    isPublic: boolean;
    leistungType: LeistungType;
    categoryId: string | null;
    inventoryItemId: string | null;
    parameters: Record<string, string | number | boolean>;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    category?: LeistungCategory | null;
    inventoryItem?: InventoryItem | null;
}

export interface QrCode {
    id: string;
    inventoryItemId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryScan {
    id: string;
    qrCodeId: string;
    userAgent: string | null;
    scannedBy: string | null;
    latitude: string | null;
    longitude: string | null;
    scannedAt: string;
}
