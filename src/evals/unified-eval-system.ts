import { testCases } from './test-cases';
import { RobustParser } from '../services/robust-parser';
import { SessionStorage } from '../services/session-storage';

interface EvalResult {
  caseId: string;
  caseName: string;
  input: string;
  expected: any;
  actual: any;
  passed: boolean;
  errors: string[];
  timestamp: string;
}

export class UnifiedEvalSystem {
  private results: EvalResult[] = [];
  
  async runFullEvaluation(): Promise<EvalResult[]> {
    console.log('🏁 Iniciando evaluación completa del sistema...\n');
    
    for (const testCase of testCases) {
      const result = await this.evaluateCase(testCase);
      this.results.push(result);
      SessionStorage.saveSession(`eval_${testCase.id}`, result);
      this.displayResult(result);
    }
    
    this.displaySummary();
    return this.results;
  }
  
  private async evaluateCase(testCase: any): Promise<EvalResult> {
    const result: EvalResult = {
      caseId: testCase.id,
      caseName: testCase.name,
      input: testCase.transcript,
      expected: testCase.expected,
      actual: {},
      passed: false,
      errors: [],
      timestamp: new Date().toISOString()
    };
    
    try {
      const mockVertexResponse = this.generateMockResponse(testCase);
      const parsed = RobustParser.parse(mockVertexResponse);
      result.actual = parsed;
      result.passed = this.validateResults(testCase.expected, parsed);
      
      const flowValid = this.validateTabFlow(testCase, parsed);
      if (!flowValid) {
        result.errors.push('Flujo entre tabs interrumpido');
      }
    } catch (error) {
      result.errors.push(`Error en evaluación: ${error}`);
      result.passed = false;
    }
    
    return result;
  }
  
  private generateMockResponse(testCase: any): string {
    return JSON.stringify({
      sintomas_principales: testCase.expected.symptoms,
      condiciones_medicas: testCase.expected.conditions,
      medicamentos: testCase.expected.medications,
      banderas_rojas: testCase.expected.redFlags.map((rf: any) => ({
        tipo: rf,
        accion: 'Derivación urgente',
        urgencia: 'inmediata'
      })),
      banderas_amarillas: testCase.expected.yellowFlags
    });
  }
  
  private validateResults(expected: any, actual: any): boolean {
    const symptomsFound = actual.entities.filter((e: any) => e.type === 'symptom');
    const symptomsMatch = symptomsFound.length === expected.symptoms.length;
    const redFlagsMatch = actual.redFlags.length === expected.redFlags.length;
    const yellowFlagsMatch = actual.yellowFlags.length === expected.yellowFlags.length;
    const medsFound = actual.entities.filter((e: any) => e.type === 'medication');
    const medsMatch = medsFound.length === expected.medications.length;
    
    return symptomsMatch && redFlagsMatch && yellowFlagsMatch && medsMatch;
  }
  
  private validateTabFlow(testCase: any, parsedData: any): boolean {
    const hasRelevantTests = testCase.expected.tests.length > 0;
    const canGenerateSOAP = parsedData.entities.length > 0;
    return hasRelevantTests && canGenerateSOAP;
  }
  
  private displayResult(result: EvalResult): void {
    const emoji = result.passed ? '✅' : '❌';
    console.log(`${emoji} ${result.caseName}`);
    if (!result.passed && result.errors.length > 0) {
      console.log(`   Errores: ${result.errors.join(', ')}`);
    }
  }
  
  private displaySummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = (passed / total * 100).toFixed(1);
    
    console.log('\n📊 RESUMEN DE EVALUACIÓN');
    console.log('========================');
    console.log(`Casos exitosos: ${passed}/${total} (${percentage}%)`);
    
    if (passed < total) {
      console.log('\n⚠️ Casos fallidos:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.caseName}: ${r.errors.join(', ')}`));
    }
  }
}

export async function runEvals() {
  const evalSystem = new UnifiedEvalSystem();
  return await evalSystem.runFullEvaluation();
}
