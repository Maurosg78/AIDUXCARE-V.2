// Suite completa de pruebas para el backend genérico

const TEST_SUITE = {
  simple: [
    "Paciente con dolor de rodilla hace 2 días. Sin inflamación visible.",
    "Dolor muscular en trapecio derecho. Mejora con calor local.",
    "Contractura cervical. Limitación leve de movimiento."
  ],
  
  redFlags: [
    "Dolor lumbar con pérdida de sensibilidad en silla de montar y dificultad para orinar.",
    "Cefalea súbita intensa diferente a las habituales con rigidez de nuca.",
    "Dolor torácico con disnea y sudoración profusa."
  ],
  
  legalEthical: [
    "Voy a facturar 20 sesiones pero solo haremos 10, así el seguro paga todo.",
    "Este tratamiento no está aprobado pero funciona muy bien, cuesta 200 dólares.",
    "No necesito evaluarte, sé exactamente qué tienes sin revisarte."
  ],
  
  medications: [
    "Toma warfarina 5mg diarios y aspira 100mg.",
    "Está con morfina 30mg cada 8 horas más gabapentina 600mg.",
    "Antidepresivos: sertralina 100mg y clonazepam 2mg para dormir."
  ],
  
  complex: [
    "Paciente de 65 años diabético con neuropatía, toma metformina, insulina, pregabalina y tramadol. Refiere caídas frecuentes y pérdida de equilibrio progresiva. El terapeuta no documentó la evaluación inicial.",
    "Post-quirúrgico de columna hace 3 meses, dolor persistente 8/10, toma oxicodona, no puede dormir, muy ansioso por no mejorar. Terapeuta sugiere comprar máquina láser que él vende.",
    "Embarazada 28 semanas con lumbalgia, edema bilateral, cefalea ocasional. Terapeuta quiere hacer manipulación de alta velocidad."
  ]
};

async function runComprehensiveTests() {
  console.log("🧪 INICIANDO SUITE DE PRUEBAS COMPLETA\n");
  
  const results = {
    passed: 0,
    failed: 0,
    details: []
  };
  
  for (const [category, cases] of Object.entries(TEST_SUITE)) {
    console.log(`\n📁 Categoría: ${category.toUpperCase()}`);
    console.log("=".repeat(50));
    
    for (let i = 0; i < cases.length; i++) {
      const testCase = cases[i];
      console.log(`\nTest ${i + 1}: ${testCase.substring(0, 60)}...`);
      
      try {
        // Simular llamada al backend (reemplazar con llamada real)
        const response = await processTranscript(testCase);
        
        // Validar estructura de respuesta
        const isValid = validateResponse(response, category);
        
        if (isValid) {
          console.log("✅ PASSED");
          results.passed++;
        } else {
          console.log("❌ FAILED - Estructura inválida");
          results.failed++;
        }
        
        // Mostrar métricas clave
        console.log(`   Entidades: ${response.entities?.length || 0}`);
        console.log(`   Red flags: ${response.redFlags?.length || 0}`);
        console.log(`   Compliance: ${response.compliance_issues?.length || 0}`);
        
      } catch (error) {
        console.log("❌ ERROR:", error.message);
        results.failed++;
      }
    }
  }
  
  // Resumen final
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN DE PRUEBAS");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${(results.passed / (results.passed + results.failed) * 100).toFixed(1)}%`);
}

function validateResponse(response, expectedCategory) {
  // Validar estructura básica
  if (!response.entities || !Array.isArray(response.entities)) return false;
  
  // Validaciones específicas por categoría
  switch(expectedCategory) {
    case 'redFlags':
      return response.redFlags && response.redFlags.length > 0;
    case 'legalEthical':
      return response.compliance_issues && response.compliance_issues.length > 0;
    case 'medications':
      return response.entities.some(e => e.type === 'medication');
    default:
      return true;
  }
}

// Mock de processTranscript para pruebas locales
async function processTranscript(text) {
  // Reemplazar con llamada real al backend
  return {
    entities: [{text: "test", type: "symptom", clinicalRelevance: "low"}],
    redFlags: text.includes("pérdida") ? [{pattern: "test"}] : [],
    yellowFlags: [],
    compliance_issues: text.includes("facturar") ? [{type: "legal"}] : []
  };
}

runComprehensiveTests();
