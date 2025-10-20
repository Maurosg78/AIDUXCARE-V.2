import { VertexAIServiceViaFirebase } from './vertex-ai-service-firebase';

/**
 * Adaptador estable para exponer un 'callVertexAI(payload)'
 * sin acoplarse al nombre del método interno de la clase.
 */
export async function callVertexAI(payload: any) {
  const svc = new VertexAIServiceViaFirebase() as any;

  const fn =
    svc.invoke ??
    svc.call ??
    svc.generate ??
    svc.run ??
    svc.request ??
    svc.process ??
    svc.execute;

  if (typeof fn !== 'function') {
    throw new Error('VertexAIServiceViaFirebase: no invocable method found');
  }
  return await fn.call(svc, payload);
}
