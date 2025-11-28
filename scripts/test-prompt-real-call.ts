/**
 * Real test: Call Vertex AI with the updated prompt to see actual output
 */

import { PromptFactory } from '../src/core/ai/PromptFactory-v3';
import { analyzeWithVertexProxy } from '../src/services/vertex-ai-service-firebase';

const testTranscript = `Ya, entonces háblame de tu dolor de mano. ¿Cuándo empezó el dolor de mano y cómo ha sido desde que partió? Hace un mes aproximadamente empezó. Empezó como una molestia leve y a medida que fui usando más la mano para dibujar o para trabajar el dolor se fue intensificando y llegando a la parte de detrás del codo. ¿Tú eres derecha o zurdo? Derecha. ¿Y por qué el lugar de la mano te molesta? Por el lado de afuera de la muñeca, por el lado de fuera de la mano. O sea, hacia el meñique. Hacia el meñique. ¿Y te duele más haciendo alguna actividad en particular? Escribiendo o dibujando. Escribiendo o dibujando. ¿Y a qué te dedicas tú? Soy animadora 3D. O sea, básicamente estás todo el día dibujando con tu mano derecha. ¿Estás usando algo para evitar el dolor? ¿Estás tomando algún remedio para el dolor? Estoy tomando ibuprofeno, paracetamol y usando una muñequera. ¿Cada cuánto tomas ibuprofeno y paracetamol? Cada 8 horas. ¿Hace cuánto tiempo? Hace una semana más o menos. ¿Haces algún tipo de deporte o actividad física que implique tu mano también? No. ¿Tienes alguna enfermedad de base que esté relacionada con tu dolor? Obesidad. ¿Obesidad? ¿Qué más? Más nada. ¿Estás tomando remedios para otro tipo de tratamiento? Sí, estoy tomando fluoxetina. ¿Cuántas fluoxetina tomas? Dos pastillas de 25 gramos. ¿Y qué te gustaría conseguir con el tratamiento de fisioterapia? Poder encontrar la forma de balancear mi trabajo sin que eso signifique dañarme la mano, aprender a usarla.`;

const contextoPaciente = "Adult patient, right-handed, 3D animator with repetitive hand use.";

async function testRealCall() {
  console.log('🧪 Testing Real Vertex AI Call\n');
  console.log('='.repeat(80));
  console.log('\n📝 TRANSCRIPT:');
  console.log(testTranscript.substring(0, 200) + '...\n');
  console.log('='.repeat(80));

  const prompt = PromptFactory.create({
    contextoPaciente,
    transcript: testTranscript,
  });

  console.log('\n📤 Calling Vertex AI...\n');

  try {
    const result = await analyzeWithVertexProxy({
      action: 'analyze',
      prompt,
      traceId: `test-${Date.now()}`,
    });

    console.log('='.repeat(80));
    console.log('\n✅ RESPONSE RECEIVED\n');
    console.log('='.repeat(80));

    // Extract text response
    const responseText = result.text || result.response || JSON.stringify(result, null, 2);
    
    // Try to parse JSON
    let parsed: any = null;
    try {
      // Remove markdown code fences if present
      const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch (e) {
      console.log('⚠️  Response is not valid JSON, showing raw text:\n');
      console.log(responseText.substring(0, 2000));
      if (responseText.length > 2000) {
        console.log('\n... (truncated)');
      }
      return;
    }

    console.log('\n📊 PARSED RESPONSE:\n');
    console.log(JSON.stringify(parsed, null, 2));

    // Validation checks
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ VALIDATION CHECKS:\n');

    const checks = {
      'Red flags include medication interaction': 
        parsed.medicolegal_alerts?.red_flags?.some((flag: string) => 
          flag.toLowerCase().includes('ibuprofen') && 
          (flag.toLowerCase().includes('fluoxetine') || flag.toLowerCase().includes('ssri')) ||
          flag.toLowerCase().includes('medication interaction') ||
          flag.toLowerCase().includes('gastrointestinal')
        ),
      'Medications show corrected dosage (50mg not 50g)':
        parsed.conversation_highlights?.medications?.some((med: string) => 
          med.includes('Fluoxetine') && med.includes('50mg') && !med.includes('50g') && !med.includes('50 grams')
        ),
      'Sedentarism in biopsychosocial':
        parsed.biopsychosocial_factors?.functional_limitations?.some((item: string) => 
          item.toLowerCase().includes('sedentary') || 
          item.toLowerCase().includes('physical activity') ||
          item.toLowerCase().includes('no exercise')
        ) ||
        parsed.biopsychosocial_factors?.occupational?.some((item: string) => 
          item.toLowerCase().includes('sedentary')
        ),
      'Obesity in medical history':
        parsed.conversation_highlights?.medical_history?.some((item: string) => 
          item.toLowerCase().includes('obesity') || item.toLowerCase().includes('obese')
        ),
      'Wrist brace in protective factors':
        parsed.biopsychosocial_factors?.protective_factors?.some((item: string) => 
          item.toLowerCase().includes('brace') || 
          item.toLowerCase().includes('wrist') ||
          item.toLowerCase().includes('muñequera')
        ),
      '3D animator in occupational':
        parsed.biopsychosocial_factors?.occupational?.some((item: string) => 
          item.toLowerCase().includes('3d') || 
          item.toLowerCase().includes('animator') ||
          item.toLowerCase().includes('drawing') ||
          item.toLowerCase().includes('repetitive')
        ),
    };

    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}: ${passed ? 'PASS' : 'FAIL'}`);
    });

    const allPassed = Object.values(checks).every(v => v);
    console.log(`\n${allPassed ? '✅' : '⚠️'} Overall: ${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}\n`);

    // Show key sections
    console.log('='.repeat(80));
    console.log('\n🔴 RED FLAGS:\n');
    if (parsed.medicolegal_alerts?.red_flags?.length > 0) {
      parsed.medicolegal_alerts.red_flags.forEach((flag: string, i: number) => {
        console.log(`${i + 1}. ${flag}`);
      });
    } else {
      console.log('(none detected)');
    }

    console.log('\n💊 MEDICATIONS:\n');
    if (parsed.conversation_highlights?.medications?.length > 0) {
      parsed.conversation_highlights.medications.forEach((med: string, i: number) => {
        console.log(`${i + 1}. ${med}`);
      });
    } else {
      console.log('(none detected)');
    }

    console.log('\n🏥 MEDICAL HISTORY:\n');
    if (parsed.conversation_highlights?.medical_history?.length > 0) {
      parsed.conversation_highlights.medical_history.forEach((item: string, i: number) => {
        console.log(`${i + 1}. ${item}`);
      });
    } else {
      console.log('(none detected)');
    }

    console.log('\n📋 BIOPSYCHOSOCIAL - FUNCTIONAL LIMITATIONS:\n');
    if (parsed.biopsychosocial_factors?.functional_limitations?.length > 0) {
      parsed.biopsychosocial_factors.functional_limitations.forEach((item: string, i: number) => {
        console.log(`${i + 1}. ${item}`);
      });
    } else {
      console.log('(none detected)');
    }

    console.log('\n💼 BIOPSYCHOSOCIAL - OCCUPATIONAL:\n');
    if (parsed.biopsychosocial_factors?.occupational?.length > 0) {
      parsed.biopsychosocial_factors.occupational.forEach((item: string, i: number) => {
        console.log(`${i + 1}. ${item}`);
      });
    } else {
      console.log('(none detected)');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testRealCall().catch(console.error);

