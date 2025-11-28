/**
 * Test script to validate prompt captures:
 * - Medication interactions (NSAIDs + SSRIs)
 * - Depression as red flag
 * - Sedentarism in biopsychosocial
 * - Dosage correction (grams → mg)
 */

import { PromptFactory } from '../src/core/ai/PromptFactory-v3';

const testTranscript = `Ya, entonces háblame de tu dolor de mano. ¿Cuándo empezó el dolor de mano y cómo ha sido desde que partió? Hace un mes aproximadamente empezó. Empezó como una molestia leve y a medida que fui usando más la mano para dibujar o para trabajar el dolor se fue intensificando y llegando a la parte de detrás del codo. ¿Tú eres derecha o zurdo? Derecha. ¿Y por qué el lugar de la mano te molesta? Por el lado de afuera de la muñeca, por el lado de fuera de la mano. O sea, hacia el meñique. Hacia el meñique. ¿Y te duele más haciendo alguna actividad en particular? Escribiendo o dibujando. Escribiendo o dibujando. ¿Y a qué te dedicas tú? Soy animadora 3D. O sea, básicamente estás todo el día dibujando con tu mano derecha. ¿Estás usando algo para evitar el dolor? ¿Estás tomando algún remedio para el dolor? Estoy tomando ibuprofeno, paracetamol y usando una muñequera. ¿Cada cuánto tomas ibuprofeno y paracetamol? Cada 8 horas. ¿Hace cuánto tiempo? Hace una semana más o menos. ¿Haces algún tipo de deporte o actividad física que implique tu mano también? No. ¿Tienes alguna enfermedad de base que esté relacionada con tu dolor? Obesidad. ¿Obesidad? ¿Qué más? Más nada. ¿Estás tomando remedios para otro tipo de tratamiento? Sí, estoy tomando fluoxetina. ¿Cuántas fluoxetina tomas? Dos pastillas de 25 gramos. ¿Y qué te gustaría conseguir con el tratamiento de fisioterapia? Poder encontrar la forma de balancear mi trabajo sin que eso signifique dañarme la mano, aprender a usarla.`;

const contextoPaciente = "Adult patient, right-handed, 3D animator with repetitive hand use.";

async function testPromptCapture() {
  console.log('🧪 Testing Prompt Capture\n');
  console.log('='.repeat(80));
  console.log('\n📝 TRANSCRIPT:');
  console.log(testTranscript);
  console.log('\n' + '='.repeat(80));
  
  const prompt = PromptFactory.create({
    contextoPaciente,
    transcript: testTranscript,
  });

  console.log('\n📋 GENERATED PROMPT (first 2000 chars):\n');
  console.log(prompt.substring(0, 2000) + '...\n');
  console.log('='.repeat(80));

  // Check for key instructions in prompt
  const checks = {
    'Medication interaction check': prompt.includes('NSAIDs') && prompt.includes('SSRIs'),
    'Dosage correction instruction': prompt.includes('25 grams') || prompt.includes('grams') && prompt.includes('mg'),
    'Sedentarism in biopsychosocial': prompt.includes('sedentary') || prompt.includes('physical activity'),
    'Depression as red flag': prompt.includes('depression') || prompt.includes('mental health'),
    'Obesity-sedentarism link': prompt.includes('obesity') && (prompt.includes('sedentary') || prompt.includes('physical activity')),
  };

  console.log('\n✅ PROMPT VALIDATION CHECKS:\n');
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  const allPassed = Object.values(checks).every(v => v);
  console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}\n`);

  // Expected outputs
  console.log('='.repeat(80));
  console.log('\n📊 EXPECTED OUTPUTS:\n');
  console.log('Red Flags should include:');
  console.log('  - Medication interaction: Ibuprofen (NSAID) + Fluoxetine (SSRI)');
  console.log('  - Depression (if mentioned or inferred from fluoxetine use)');
  console.log('\nMedications should show:');
  console.log('  - Fluoxetine, 50mg daily (corrected from "25 grams" → "25mg x2")');
  console.log('  - Ibuprofen, [dosage], every 8 hours, 1 week');
  console.log('  - Paracetamol, [dosage], every 8 hours, 1 week');
  console.log('\nBiopsychosocial should include:');
  console.log('  - Sedentary lifestyle (no physical activity reported)');
  console.log('  - Obesity in medical_history');
  console.log('  - Occupational: 3D animator, repetitive drawing/writing');
  console.log('  - Protective: Wrist brace use');
  console.log('\n' + '='.repeat(80));
}

testPromptCapture().catch(console.error);

