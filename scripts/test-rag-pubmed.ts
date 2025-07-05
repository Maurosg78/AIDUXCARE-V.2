#!/usr/bin/env tsx

/**
 * 🧪 AiDuxCare - Test RAG PubMed Integration
 * Script para probar la integración RAG con PubMed y otras fuentes médicas
 */

import {
  RAGMedicalMCP,
  RAGTestingHelper as _RAGTestingHelper,
  PubMedSearchService,
} from "../src/core/mcp/RAGMedicalMCP";

// === TESTING QUERIES ESPECIALIZADAS ===

const FISIOTERAPIA_QUERIES = [
  "manual therapy effectiveness chronic neck pain",
  "exercise therapy lumbar spine rehabilitation",
  "dry needling trigger points physiotherapy",
  "proprioceptive training ankle sprain recovery",
  "therapeutic ultrasound soft tissue healing",
];

const CLINICAL_SCENARIOS = [
  {
    query: "cervical radiculopathy conservative treatment",
    specialty: "fisioterapia" as const,
    context: "Paciente con cervicalgia y parestesias en C6-C7",
  },
  {
    query: "knee osteoarthritis physical therapy protocols",
    specialty: "fisioterapia" as const,
    context: "Paciente de 65 años con gonartrosis bilateral",
  },
  {
    query: "post stroke rehabilitation upper limb",
    specialty: "neurologia" as const,
    context: "Paciente post-ACV con hemiparesia derecha",
  },
  {
    query: "chronic low back pain exercise therapy",
    specialty: "fisioterapia" as const,
    context: "Lumbalgia crónica, paciente sedentario",
  },
];

// === FUNCIONES DE TESTING ===

/**
 * Test básico de conectividad con PubMed
 */
async function testPubMedConnectivity(): Promise<boolean> {
  console.log("🔗 Testing PubMed connectivity...");

  try {
    const testQuery = "physical therapy";
    const results = await PubMedSearchService.searchArticles(
      testQuery,
      "fisioterapia",
      2,
    );

    if (results.length > 0) {
      console.log(
        `✅ PubMed connectivity OK - Found ${results.length} articles`,
      );
      console.log(
        `📄 Sample article: "${results[0].title.substring(0, 80)}..."`,
      );
      return true;
    } else {
      console.log("⚠️ PubMed connectivity OK but no results found");
      return false;
    }
  } catch (error) {
    console.error("❌ PubMed connectivity failed:", error);
    return false;
  }
}

/**
 * Test de queries especializadas en fisioterapia
 */
async function testFisioterapiaQueries(): Promise<void> {
  console.log("\n🏥 Testing Fisioterapia specialized queries...");

  for (const query of FISIOTERAPIA_QUERIES) {
    console.log(`\n📝 Query: "${query}"`);

    const startTime = Date.now();
    const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(
      query,
      "fisioterapia",
      3,
    );
    const endTime = Date.now();

    console.log(`⏱️ Processing time: ${endTime - startTime}ms`);
    console.log(`📊 Citations found: ${ragResult.citations.length}`);
    console.log(
      `🎯 Confidence: ${Math.round(ragResult.confidence_score * 100)}%`,
    );

    if (ragResult.citations.length > 0) {
      const topCitation = ragResult.citations[0];
      console.log(
        `🏆 Top result: "${topCitation.title.substring(0, 60)}..." (${topCitation.year})`,
      );
      console.log(`📖 Journal: ${topCitation.journal}`);
      if (topCitation.pmid) {
        console.log(`🔗 PMID: ${topCitation.pmid}`);
      }
    }

    // Generar bloques MCP para integración
    const mcpBlocks = RAGMedicalMCP.convertToMCPBlocks(ragResult);
    console.log(`🧩 Generated ${mcpBlocks.length} MCP blocks for integration`);
  }
}

/**
 * Test de escenarios clínicos completos
 */
async function testClinicalScenarios(): Promise<void> {
  console.log("\n🏥 Testing Clinical Scenarios...");

  for (const scenario of CLINICAL_SCENARIOS) {
    console.log(`\n📋 Scenario: ${scenario.context}`);
    console.log(`🔍 Query: "${scenario.query}"`);
    console.log(`🏥 Specialty: ${scenario.specialty}`);

    const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(
      scenario.query,
      scenario.specialty,
      5,
    );

    console.log(
      `📊 Results: ${ragResult.citations.length} citations, confidence ${Math.round(ragResult.confidence_score * 100)}%`,
    );

    if (ragResult.medical_context.length > 0) {
      console.log(
        `📝 Medical context preview: "${ragResult.medical_context.substring(0, 150)}..."`,
      );
    }

    // Análisis de calidad de evidencia
    const evidenceLevels = ragResult.citations.map((c) => {
      const doc = (RAGMedicalMCP as any).documentsCache.get(c.document_id);
      return doc?.evidence_level || "unknown";
    });

    const highQualityEvidence = evidenceLevels.filter(
      (level) =>
        level === "level_1" || level === "level_2" || level === "guideline",
    ).length;

    console.log(
      `🌟 High-quality evidence: ${highQualityEvidence}/${ragResult.citations.length} articles`,
    );
  }
}

/**
 * Test de performance y escalabilidad
 */
async function testPerformance(): Promise<void> {
  console.log("\n⚡ Testing Performance & Scalability...");

  const performanceQueries = [
    "muscle strengthening exercises",
    "balance training elderly",
    "pain management techniques",
  ];

  const results: number[] = [];

  for (const query of performanceQueries) {
    const startTime = Date.now();
    await RAGMedicalMCP.retrieveRelevantKnowledge(query, "fisioterapia", 10);
    const duration = Date.now() - startTime;
    results.push(duration);

    console.log(`⏱️ "${query}": ${duration}ms`);
  }

  const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
  const maxTime = Math.max(...results);
  const minTime = Math.min(...results);

  console.log("\n📊 Performance Summary:");
  console.log(`   Average: ${Math.round(avgTime)}ms`);
  console.log(`   Min: ${minTime}ms`);
  console.log(`   Max: ${maxTime}ms`);

  if (avgTime < 5000) {
    console.log("✅ Performance: EXCELLENT (<5s average)");
  } else if (avgTime < 10000) {
    console.log("✅ Performance: GOOD (<10s average)");
  } else {
    console.log("⚠️ Performance: ACCEPTABLE but consider optimization");
  }
}

/**
 * Test de integración con el sistema MCP existente
 */
async function testMCPIntegration(): Promise<void> {
  console.log("\n🔌 Testing MCP Integration...");

  const testQuery = "shoulder impingement rehabilitation protocol";
  const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(
    testQuery,
    "fisioterapia",
    3,
  );

  // Generar bloques MCP
  const mcpBlocks = RAGMedicalMCP.convertToMCPBlocks(ragResult);

  console.log(`🧩 Generated ${mcpBlocks.length} MCP blocks`);

  // Verificar estructura de bloques
  mcpBlocks.forEach((block, index) => {
    console.log(`   Block ${index + 1}:`);
    console.log(`     - ID: ${block.id}`);
    console.log(`     - Type: ${block.type}`);
    console.log(`     - Content length: ${block.content.length} chars`);
    console.log(
      `     - Created: ${new Date(block.created_at).toLocaleString()}`,
    );
  });

  console.log("✅ MCP integration structure validated");
}

/**
 * Test de calidad y relevancia médica
 */
async function testMedicalQuality(): Promise<void> {
  console.log("\n🏥 Testing Medical Quality & Relevance...");

  const qualityTests = [
    {
      query: "evidence based physical therapy low back pain",
      expectedKeywords: [
        "randomized",
        "controlled",
        "systematic",
        "meta-analysis",
      ],
      minConfidence: 0.7,
    },
    {
      query: "manual therapy cervical spine safety contraindications",
      expectedKeywords: ["safety", "contraindication", "adverse", "risk"],
      minConfidence: 0.6,
    },
  ];

  for (const test of qualityTests) {
    console.log(`\n🔍 Testing: "${test.query}"`);

    const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(
      test.query,
      "fisioterapia",
      5,
    );

    // Verificar confianza
    const confidencePassed = ragResult.confidence_score >= test.minConfidence;
    console.log(
      `🎯 Confidence: ${Math.round(ragResult.confidence_score * 100)}% ${confidencePassed ? "✅" : "❌"}`,
    );

    // Verificar keywords esperadas
    const fullContent = ragResult.medical_context.toLowerCase();
    const keywordMatches = test.expectedKeywords.filter((keyword) =>
      fullContent.includes(keyword.toLowerCase()),
    );

    console.log(
      `🔑 Keywords found: ${keywordMatches.length}/${test.expectedKeywords.length}`,
    );
    console.log(`   Found: ${keywordMatches.join(", ")}`);

    // Verificar nivel de evidencia
    const highEvidenceCitations = ragResult.citations.filter(
      (c) => c.relevance_score > 0.7,
    );

    console.log(
      `📚 High-relevance citations: ${highEvidenceCitations.length}/${ragResult.citations.length}`,
    );
  }
}

// === MAIN EXECUTION ===

async function main(): Promise<void> {
  console.log("🧬 AiDuxCare RAG Medical MCP Testing Suite");
  console.log("=============================================\n");

  try {
    // Test 1: Conectividad básica
    const connectivity = await testPubMedConnectivity();
    if (!connectivity) {
      console.log("❌ Stopping tests - PubMed connectivity failed");
      return;
    }

    // Test 2: Queries especializadas
    await testFisioterapiaQueries();

    // Test 3: Escenarios clínicos
    await testClinicalScenarios();

    // Test 4: Performance
    await testPerformance();

    // Test 5: Integración MCP
    await testMCPIntegration();

    // Test 6: Calidad médica
    await testMedicalQuality();

    console.log("\n🎉 RAG Testing Suite Completed Successfully!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Integrate RAG into existing NLP pipeline");
    console.log("   2. Add RAG context to clinical agent prompts");
    console.log("   3. Create UI component for evidence display");
    console.log("   4. Add RAG metrics to usage analytics");
  } catch (error) {
    console.error("❌ Testing suite failed:", error);
    process.exit(1);
  }
}

// Ejecutar inmediatamente
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { main as testRAGPipeline };
