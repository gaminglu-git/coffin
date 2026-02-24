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
}

export interface Appointment {
    id: string;
    title: string;
    date: string;
    createdAt: string;
    caseId?: string | null;
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
    createdAt: string;
    updatedAt: string;
    category?: InventoryCategory | null;
    location?: InventoryLocation | null;
    qrCodes?: QrCode[];
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
