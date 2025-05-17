export const createClient = vi.fn(() => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'mock-user-id' },
        },
      },
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: [{ id: 'mock-id' }], error: null }),
  })),
}));
