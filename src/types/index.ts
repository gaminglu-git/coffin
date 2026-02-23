export type CaseStatus = 'Neu' | 'In Planung' | 'Behörden & Orga' | 'Trauerfeier' | 'Abgeschlossen';

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
}

export interface Task {
    id: string;
    title: string;
    assignee: string;
    assigneeId?: string | null;
    dueDate: string | null;
    completed: boolean;
    createdAt: string;
}

export interface Appointment {
    id: string;
    title: string;
    date: string;
    createdAt: string;
}

export interface Message {
    id: string;
    text: string;
    author: string;
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

export interface InventoryItem {
    id: string;
    title: string;
    description: string | null;
    status: InventoryItemStatus;
    sequentialId: string | null;
    categoryId: string | null;
    locationId: string | null;
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
