/**
 * Módulo Model Context Protocol (MCP)
 * 
 * Proporciona la infraestructura para construir y gestionar el contexto
 * que se utiliza en los modelos de AiDuxCare V.2
 */

export { MCPManager } from './MCPManager';
export type { MCPContext } from './schema';
export { buildMCPContext } from './MCPContextBuilder'; 