// Configuration for the cascading dropdown on the update form.
// Each DropdownLevel defines one field in PCUpdatePayload, which parent field it depends on,
// and which options are available for each value of that parent.
// When a level's selection changes, all levels below it are reset.
// The options here are placeholder values — confirm with stakeholders before going live.

import type { PCUpdatePayload } from '../types/pc.types';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownLevel {
  key: keyof PCUpdatePayload;
  label: string;
  dependsOn: keyof PCUpdatePayload | null;
  options: Record<string, DropdownOption[]> | DropdownOption[];
}

export const dropdownConfig: DropdownLevel[] = [
  {
    key: 'currentUser',
    label: '使用者',
    dependsOn: null,
    options: [], // Populated dynamically from employee search
  },
  {
    key: 'status',
    label: '状況',
    dependsOn: 'currentUser',
    options: {
      hasUser: [
        { value: 'loaned', label: '貸出中' },
        { value: 'maintenance', label: 'メンテナンス中' },
      ],
      noUser: [
        { value: 'available', label: '使用可能' },
        { value: 'retired', label: '廃棄' },
      ],
    },
  },
  {
    key: 'classification',
    label: '分類',
    dependsOn: 'status',
    options: {
      loaned: [{ value: 'loaned', label: '貸出' }],
      available: [{ value: 'in-house', label: '社内' }],
      maintenance: [{ value: 'in-house', label: '社内' }],
      retired: [{ value: 'in-house', label: '社内' }],
    },
  },
  {
    key: 'location',
    label: '場所',
    dependsOn: 'classification',
    options: {
      loaned: [{ value: 'off-site', label: '社外' }],
      'in-house': [
        { value: 'office-a', label: 'オフィスA' },
        { value: 'office-b', label: 'オフィスB' },
        { value: 'storage', label: '倉庫' },
      ],
    },
  },
  {
    key: 'purpose',
    label: '用途',
    dependsOn: 'location',
    options: {
      'off-site': [
        { value: 'client-work', label: '顧客業務' },
        { value: 'remote-work', label: 'リモートワーク' },
      ],
      'office-a': [
        { value: 'general', label: '一般業務' },
        { value: 'development', label: '開発' },
      ],
      'office-b': [{ value: 'general', label: '一般業務' }],
      storage: [{ value: 'spare', label: '予備' }],
    },
  },
  {
    key: 'category',
    label: '区分',
    dependsOn: 'purpose',
    options: {
      'client-work': [
        { value: 'laptop', label: 'ノートPC' },
        { value: 'tablet', label: 'タブレット' },
      ],
      'remote-work': [{ value: 'laptop', label: 'ノートPC' }],
      general: [
        { value: 'laptop', label: 'ノートPC' },
        { value: 'desktop', label: 'デスクトップPC' },
      ],
      development: [
        { value: 'laptop', label: 'ノートPC' },
        { value: 'desktop', label: 'デスクトップPC' },
      ],
      spare: [
        { value: 'laptop', label: 'ノートPC' },
        { value: 'desktop', label: 'デスクトップPC' },
        { value: 'tablet', label: 'タブレット' },
      ],
    },
  },
];