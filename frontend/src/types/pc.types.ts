// Core data types for PC devices.
// PC is the full device record returned from the backend.
// PCUpdatePayload is what the frontend sends when a user submits the update form.
// PCHistory represents a single logged change, appended to the History sheet on every update.

export type PCStatus = 'available' | 'loaned' | 'maintenance' | 'retired';

export type PCClassification = 'in-house' | 'loaned';

export type PCCategory = 'laptop' | 'desktop' | 'tablet';

export interface PC {
  id: string;
  name: string;
  status: PCStatus;
  classification: PCClassification;
  purpose: string;
  category: PCCategory;
  location: string;
  currentUser: string;
  qrCode: string;
}

export interface PCUpdatePayload {
  id: string;
  status: PCStatus;
  classification: PCClassification;
  purpose: string;
  category: PCCategory;
  location: string;
  currentUser: string;
}

export interface PCHistory {
  pcId: string;
  updatedAt: string;
  updatedBy: string;
  changes: Partial<PC>;
}