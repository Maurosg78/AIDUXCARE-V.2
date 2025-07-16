import { vi } from "vitest";
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: () => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle
  })
};

export default mockSupabase;
export {
  mockSelect,
  mockInsert,
  mockUpdate,
  mockDelete,
  mockEq,
  mockOrder,
  mockSingle
};
