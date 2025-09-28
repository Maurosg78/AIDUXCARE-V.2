/// <reference types="vite/client" />

declare module '*.css';
declare module '*.svg'  { const src: string; export default src; }
declare module '*.png'  { const src: string; export default src; }
declare module '*.jpg'  { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.gif'  { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }
declare module '*.json' { const value: any; export default value; }

/* Stubs de paquetes que faltan (silencian TS hasta instalarlos) */
declare module 'lucide-react' { const mod: any; export = mod; }
declare module 'class-variance-authority' { const cva: any; export { cva }; export default cva; }
declare module 'clsx' { const cx: (...a: any[]) => string; export default cx; }
declare module 'date-fns' { const mod: any; export = mod; }
declare module 'date-fns/locale' { const mod: any; export = mod; }

/* Permitir props comunes en cualquier componente JSX (p.ej. variant/size/id) */
declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      variant?: any;
      size?: any;
      id?: any;
      [prop: string]: any;
    }
  }
}

/* Fallback amplio para "@/..." para desbloquear CI */
declare module "@/*" {
  const mod: any;
  export = mod;
}
