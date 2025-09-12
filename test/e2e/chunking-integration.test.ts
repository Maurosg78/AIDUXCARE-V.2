import { test, expect } from '@playwright/test';

test.describe('Chunking System Integration', () => {
  
  test('Procesa anamnesis de 15 minutos correctamente', async ({ page }) => {
    await page.goto('http://localhost:5177/professional-workflow');
    
    // Texto de ~15 minutos (2000 palabras)
    const longAnamnesis = `
      Patient Margaret Thompson, 72 years old, presents with complex medical history.
      Chief complaint: Severe lower back pain radiating to left leg for 3 months.
      
      History of present illness: The pain started gradually after gardening.
      Initially mild, now 8/10 intensity. Worse in mornings, improves with movement.
      No relief with over-the-counter medications. Disturbs sleep significantly.
      
      Past medical history: Type 2 diabetes for 10 years, controlled with medication.
      Hypertension diagnosed 5 years ago. Previous lumbar surgery in 2018.
      No history of cancer. No recent infections or fever.
      
      Medications: Metformin 1000mg twice daily, Lisinopril 10mg daily.
      Patient is allergic to penicillin - causes severe rash and breathing difficulty.
      Also taking Gabapentin 300mg for neuropathic pain.
      
      Social history: Lives alone since husband passed. Daughter visits weekly.
      Former smoker, quit 10 years ago. Minimal alcohol consumption.
      Retired teacher, relatively sedentary lifestyle now.
      
      Review of systems: Denies chest pain, shortness of breath, or palpitations.
      No recent weight loss. Appetite normal. No bowel or bladder dysfunction.
      Mentions feeling somewhat depressed due to chronic pain and isolation.
      Explicitly denies any suicidal ideation when asked directly.
      
      Physical examination pending. Patient appears uncomfortable but alert.
      Vital signs stable. Will proceed with detailed musculoskeletal assessment.
    `.repeat(3); // Hacer más largo para forzar chunking
    
    await page.fill('textarea', longAnamnesis);
    
    // Debe aparecer mensaje de chunking
    await page.click('text=IA Analysis');
    
    // Verificar indicador de progreso
    await expect(page.locator('text=/Procesando.*secciones/i')).toBeVisible({ timeout: 5000 });
    
    // Esperar resultados
    await expect(page.locator('text=/Clinical Findings|Hallazgos/i')).toBeVisible({ timeout: 30000 });
    
    // Verificar que información crítica no se perdió
    const results = await page.content();
    
    // Debe detectar alergia a penicilina
    expect(results).toContain('penicillin');
    
    // Debe preservar negación de ideación suicida
    if (results.includes('suicid')) {
      expect(results).toContain('denies');
    }
  });

  test('Preserva red flags en chunking', async ({ page }) => {
    await page.goto('http://localhost:5177/professional-workflow');
    
    const criticalCase = `
      Start of very long patient history with multiple conditions.
      ${Array(500).fill('Regular medical history details').join(' ')}
      
      CRITICAL: Patient mentions suicidal thoughts yesterday.
      
      ${Array(500).fill('More medical history').join(' ')}
      
      CRITICAL: Chest pain with shortness of breath.
      
      ${Array(500).fill('Additional findings').join(' ')}
    `;
    
    await page.fill('textarea', criticalCase);
    await page.click('text=IA Deep Analysis');
    
    // Esperar procesamiento
    await page.waitForTimeout(15000);
    
    // Verificar que AMBOS red flags se detectaron
    const content = await page.content();
    expect(content.toLowerCase()).toContain('suicid');
    expect(content.toLowerCase()).toContain('chest');
  });
});
