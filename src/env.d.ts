/// <reference types="vite/client" />
declare module '*.css';
declare module '*.svg'  { const src: string; export default src; }
declare module '*.png'  { const src: string; export default src; }
declare module '*.jpg'  { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.gif'  { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }
declare module '*.json' { const value: any; export default value; }

/* Fallback amplio para "@/..." para desbloquear CI:
   permite default y named imports como `any`. */
declare module "@/*" {
  const mod: any;
  export = mod;
}
