// Este archivo proporciona un mock básico para @tanstack/react-virtual
// para resolver problemas de dependencias

export const useVirtualizer = () => ({
  getVirtualItems: () => [],
  getTotalSize: () => 0,
  measure: () => {},
  scrollToIndex: () => {},
  scrollToOffset: () => {},
  getVirtualItemForOffset: () => null,
});

export default {
  useVirtualizer,
};
