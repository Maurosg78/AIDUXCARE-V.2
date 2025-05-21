export class MCPManager {
  async getContextForVisit(visitId: string): Promise<any> {
    return { context: 'mocked context for visitId ' + visitId };
  }

  async saveContext(visitId: string, context: any) {
    console.log(`[MCPManager] Context saved for ${visitId}`, context);
  }
}
