// Mock para use-sync-external-store
export const useSyncExternalStore = (subscribe: any, getSnapshot: any) => {
  return getSnapshot();
};

// Mock para with-selector
export const useSyncExternalStoreWithSelector = (subscribe: any, getSnapshot: any, getServerSnapshot: any, selector: any, isEqual: any) => {
  return selector(getSnapshot());
};

export default {
  useSyncExternalStore,
  useSyncExternalStoreWithSelector
}; 