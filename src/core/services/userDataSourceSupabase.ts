export const userDataSourceSupabase = {
  async getUserProfile(userId: string): Promise<UserProfile> {
    return { id: userId, name: "Mock User", role: "clinician" };
  },

  async signInWithPassword(_email: string, _password: string) {
    return {
      session: { user: { id: "mock-user-id" } },
      user: { id: "mock-user-id" },
    };
  },

  async signUp(
    _email: string,
    _password: string,
    _options: { full_name: string; role: RoleType },
  ) {
    return { user: { id: "mock-user-id" } };
  },
};

export type UserProfile = {
  id: string;
  name: string;
  role: RoleType;
};

export type RoleType = "admin" | "clinician" | "professional" | "patient";
