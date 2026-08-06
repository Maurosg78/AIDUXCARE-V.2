import type { TreatmentDecisionItem } from '../services/sessionService';
import type { TodayFocusItem } from './parsePlanToFocus';

export function isActiveTreatmentDecisionItem(
  item: Pick<TreatmentDecisionItem, 'removedPermanently'>,
): boolean {
  return item.removedPermanently !== true;
}

export function markTreatmentDecisionItemRemoved(
  item: TodayFocusItem,
  audit: {
    removedPermanentlyAt: string;
    removedPermanentlyBy: string;
    removedPermanentlyReason?: string;
  },
): TodayFocusItem {
  const normalizedReason = audit.removedPermanentlyReason?.trim();
  return {
    ...item,
    completed: false,
    removedPermanently: true,
    removedPermanentlyAt: audit.removedPermanentlyAt,
    removedPermanentlyBy: audit.removedPermanentlyBy,
    ...(normalizedReason ? { removedPermanentlyReason: normalizedReason } : {}),
  };
}

export function normalizeTreatmentDecisionItem(item: TodayFocusItem): TreatmentDecisionItem {
  const normalizedItem: TreatmentDecisionItem = {
    id: item.id,
    label: item.label,
    completed: Boolean(item.completed),
    ...(item.notes ? { notes: item.notes } : {}),
  };

  if (item.removedPermanently === true) {
    normalizedItem.removedPermanently = true;
    if (item.removedPermanentlyAt) {
      normalizedItem.removedPermanentlyAt = item.removedPermanentlyAt;
    }
    if (item.removedPermanentlyBy) {
      normalizedItem.removedPermanentlyBy = item.removedPermanentlyBy;
    }
    if (item.removedPermanentlyReason) {
      normalizedItem.removedPermanentlyReason = item.removedPermanentlyReason;
    }
  }

  return normalizedItem;
}

export function hydrateTreatmentDecisionItems(
  items: TreatmentDecisionItem[],
): TodayFocusItem[] {
  return items
    .map((item) => ({
      id: item.id,
      label: item.label,
      completed: false,
      ...(item.notes ? { notes: item.notes } : {}),
      ...(item.removedPermanently === true ? { removedPermanently: true } : {}),
      ...(item.removedPermanentlyAt ? { removedPermanentlyAt: item.removedPermanentlyAt } : {}),
      ...(item.removedPermanentlyBy ? { removedPermanentlyBy: item.removedPermanentlyBy } : {}),
      ...(item.removedPermanentlyReason ? { removedPermanentlyReason: item.removedPermanentlyReason } : {}),
      source: 'plan' as const,
    }));
}
