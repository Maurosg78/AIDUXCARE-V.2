export type User = { uid: string; email?: string|null; emailVerified?: boolean };
const state: { currentUser: User|null } = { currentUser: null };

export const getAuth = () => ({ currentUser: state.currentUser });
export const onAuthStateChanged = (_auth:any, cb:(u:User|null)=>void) => { queueMicrotask(() => cb(state.currentUser)); return () => {}; };
export const signInWithEmailAndPassword = async (_auth:any, email:string, _pwd:string) => {
  state.currentUser = { uid:'test-uid', email, emailVerified:false }; return { user: state.currentUser };
};
export const sendEmailVerification = async (_user:User) => true;
export const signOut = async () => { state.currentUser = null; };
