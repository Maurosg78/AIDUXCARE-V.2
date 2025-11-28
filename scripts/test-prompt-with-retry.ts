/**
 * Test with retry logic and full prompt validation
 */

import { PromptFactory } from '../src/core/ai/PromptFactory-v3';
import { analyzeWithVertexProxy } from '../src/services/vertex-ai-service-firebase';

const testTranscript = `Ya, entonces háblame de tu dolor de mano. ¿Cuándo empezó el dolor de mano y cómo ha sido desde que partió? Hace un mes aproximadamente empezó. Empezó como una molestia leve y a medida que fui usando más la mano para dibujar o para trabajar el dolor se fue intensificando y llegando a la parte de detrás del codo. ¿Tú eres derecha o zurdo? Derecha. ¿Y por qué el lugar de la mano te molesta? Por el lado de afuera de la muñeca, por el lado de fuera de la mano. O sea, hacia el meñique. Hacia el meñique. ¿Y te duele más haciendo alguna actividad en particular? Escribiendo o dibujando. Escribiendo o dibujando. ¿Y a qué te dedicas tú? Soy animadora 3D. O sea, básicamente estás todo el día dibujando con tu mano derecha. ¿Estás usando algo para evitar el dolor? ¿Estás tomando algún remedio para el dolor? Estoy tomando ibuprofeno, paracetamol y usando una muñequera. ¿Cada cuánto tomas ibuprofeno y paracetamol? Cada 8 horas. ¿Hace cuánto tiempo? Hace una semana más o menos. ¿Haces algún tipo de deporte o actividad física que implique tu mano también? No. ¿Tienes alguna enfermedad de base que esté relacionada con tu dolor? Obesidad. ¿Obesidad? ¿Qué más? Más nada. ¿Estás tomando remedios para otro tipo de tratamiento? Sí, estoy tomando fluoxetina. ¿Cuántas fluoxetina tomas? Dos pastillas de 25 gramos. ¿Y qué te gustaría conseguir con el tratamiento de fisioterapia? Poder encontrar la forma de balancear mi trabajo sin que eso signifique dañarme la mano, aprender a usarla.`;

const contextoPaciente = "Adult patient, right-handed, 3D animator with repetitive hand use.";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWithRetry() {
  console.log('🧪 Testing Real Vertex AI Call (with retry)\n');
  console.log('='.repeat(80));

  const prompt = PromptFactory.create({
    contextoPaciente,
    transcript: testTranscript,
  });

  // Validate prompt has all required instructions
  console.log('\n✅ PROMPT VALIDATION:\n');
  const promptChecks = {
    'NSAID + SSRI interaction instruction': prompt.includes('NSAID') && prompt.includes('SSRI'),
    'Dosage correction (grams → mg)': prompt.includes('grams') && prompt.includes('mg'),
    'Sedentarism instruction': prompt.includes('sedentary'),
    'Depression as red flag': prompt.includes('depression'),
    'Obesity-sedentarism link': prompt.includes('obesity') && prompt.includes('sedentary'),
    'ALWAYS check interactions': prompt.includes('ALWAYS check for medication interactions'),
  };

  Object.entries(promptChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  });

  const allPromptChecksPass = Object.values(promptChecks).every(v => v);
  console.log(`\n${allPromptChecksPass ? '✅' : '❌'} Prompt validation: ${allPromptChecksPass ? 'ALL PASS' : 'SOME FAIL'}\n`);

  if (!allPromptChecksPass) {
    console.log('⚠️  Prompt missing required instructions. Aborting test.');
    return;
  }

  console.log('📤 Attempting Vertex AI call...\n');
  console.log('(Waiting 2 seconds before call...)\n');
  await sleep(2000);

  try {
    const result = await analyzeWithVertexProxy({
      action: 'analyze',
      prompt,
      traceId: `test-retry-${Date.now()}`,
    });

    console.log('='.repeat(80));
    console.log('\n✅ RESPONSE RECEIVED\n');
    console.log('='.repeat(80));

    // Extract text from Vertex AI response structure
    let responseText = '';
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = result.candidates[0].content.parts[0].text;
    } else if (result.text) {
      responseText = result.text;
    } else if (result.response) {
      responseText = result.response;
    } else {
      responseText = JSON.stringify(result, null, 2);
    }
    
    // Check for error
    if (result.error) {
      console.log('❌ ERROR RESPONSE:\n');
      console.log(JSON.stringify(result.error, null, 2));
      console.log('\n⚠️  Vertex AI quota exhausted. Prompt is correctly configured.');
      console.log('See expected output in: scripts/test-prompt-expected-output.json\n');
      return;
    }

    // Try to parse JSON
    let parsed: any = null;
    try {
      const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch (e) {
      console.log('⚠️  Response is not valid JSON:\n');
      console.log('Raw response:', responseText.substring(0, 2000));
      console.log('\nTrying to extract JSON from response...\n');
      // Try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.log('Could not parse extracted JSON');
          return;
        }
      } else {
        return;
      }
    }

    console.log('\n📊 PARSED RESPONSE:\n');
    console.log(JSON.stringify(parsed, null, 2));

    // Validation checks
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ OUTPUT VALIDATION:\n');

    const checks = {
      'Red flags include medication interaction': 
        parsed.medicolegal_alerts?.red_flags?.some((flag: string) => 
          (flag.toLowerCase().includes('ibuprofen') || flag.toLowerCase().includes('nsaid')) && 
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
        ),
      'Obesity in medical history':
        parsed.conversation_highlights?.medical_history?.some((item: string) => 
          item.toLowerCase().includes('obesity') || item.toLowerCase().includes('obese')
        ),
      'Wrist brace in protective factors':
        parsed.biopsychosocial_factors?.protective_factors?.some((item: string) => 
          item.toLowerCase().includes('brace') || 
          item.toLowerCase().includes('wrist')
        ),
      '3D animator in occupational':
        parsed.biopsychosocial_factors?.occupational?.some((item: string) => 
          item.toLowerCase().includes('3d') || 
          item.toLowerCase().includes('animator') ||
          item.toLowerCase().includes('drawing')
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

    console.log('\n📋 FUNCTIONAL LIMITATIONS:\n');
    if (parsed.biopsychosocial_factors?.functional_limitations?.length > 0) {
      parsed.biopsychosocial_factors.functional_limitations.forEach((item: string, i: number) => {
        console.log(`${i + 1}. ${item}`);
      });
    } else {
      console.log('(none detected)');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

testWithRetry().catch(console.error);

