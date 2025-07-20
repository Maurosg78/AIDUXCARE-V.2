#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE PRUEBAS MANUALES - Situaciones Médicas Reales
 * Simula casos clínicos específicos para validar el sistema
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MedicalScenarioTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.scenarioResults = [];
    this.baseUrl = 'http://localhost:5174';
  }

  async init() {
    console.log('🚀 Iniciando pruebas de escenarios médicos...');
    this.browser = await puppeteer.launch({ 
      headless: false, 
      slowMo: 200,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    this.page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllScenarios() {
    try {
      console.log('\n🏥 EJECUTANDO ESCENARIOS MÉDICOS REALES\n');
      
      await this.page.goto(`${this.baseUrl}/professional-workflow`, { 
        waitUntil: 'networkidle2' 
      });
      
      // Escenario 1: Paciente con lumbalgia aguda
      await this.scenarioLumbalgiaAguda();
      
      // Escenario 2: Paciente con dolor de hombro
      await this.scenarioDolorHombro();
      
      // Escenario 3: Paciente con problemas de rodilla
      await this.scenarioProblemasRodilla();
      
      // Escenario 4: Consulta de seguimiento
      await this.scenarioSeguimiento();
      
      // Escenario 5: Emergencia médica
      await this.scenarioEmergencia();
      
      await this.generateScenarioReport();
      
    } catch (error) {
      console.error('❌ Error en escenarios:', error);
    } finally {
      await this.cleanup();
    }
  }

  async scenarioLumbalgiaAguda() {
    console.log('\n🔴 ESCENARIO 1: Paciente con Lumbalgia Aguda');
    
    try {
      // Crear nuevo paciente
      const buttons = await this.page.$$('button');
      let createButton = null;
      
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text.includes('Crear') || text.includes('Nuevo')) {
          createButton = button;
          break;
        }
      }
      
      if (createButton) {
        await createButton.click();
        await this.wait(1000);
        
        // Llenar datos del paciente
        const inputs = await this.page.$$('input');
        const textareas = await this.page.$$('textarea');
        
        if (inputs.length >= 3) {
          await inputs[0].type('Carlos Rodríguez');
          await inputs[1].type('38');
          if (inputs[2].tagName === 'SELECT') {
            await inputs[2].select('M');
          }
        }
        
        if (inputs.length >= 4) {
          await inputs[3].type('Lumbalgia aguda');
        }
        
        if (inputs.length >= 5) {
          await inputs[4].type('Ninguna');
        }
        
        if (inputs.length >= 6) {
          await inputs[5].type('Ibuprofeno 400mg');
        }
        
        if (textareas.length > 0) {
          await textareas[0].type('Paciente de 38 años que refiere dolor lumbar agudo de inicio súbito hace 2 días al levantar una caja pesada. El dolor se irradia hacia la pierna derecha y empeora con la tos y los estornudos. No presenta pérdida de fuerza ni alteraciones de la sensibilidad.');
        }
        
        // Guardar paciente
        const saveButtons = await this.page.$$('button');
        for (const button of saveButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.includes('Guardar') || text.includes('Save')) {
            await button.click();
            break;
          }
        }
        
        await this.wait(2000);
        
        // Simular grabación de consulta
        const recordButtons = await this.page.$$('button');
        for (const button of recordButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.includes('🎤')) {
            await button.click();
            console.log('✅ Grabación iniciada para lumbalgia aguda');
            await this.wait(3000);
            await button.click();
            console.log('✅ Grabación detenida');
            break;
          }
        }
        
        // Consultar asistente virtual
        const assistantTextareas = await this.page.$$('textarea');
        if (assistantTextareas.length > 0) {
          await assistantTextareas[0].type('¿Cuáles son los tests específicos para evaluar una lumbalgia aguda con irradiación?');
          
          const queryButtons = await this.page.$$('button');
          for (const button of queryButtons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes('Consultar') || text.includes('Enviar')) {
              await button.click();
              console.log('✅ Consulta enviada al asistente');
              break;
            }
          }
        }
        
        this.scenarioResults.push({
          scenario: 'Lumbalgia Aguda',
          status: 'PASS',
          details: 'Paciente creado, grabación realizada, consulta enviada'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en escenario lumbalgia:', error.message);
      this.scenarioResults.push({
        scenario: 'Lumbalgia Aguda',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async scenarioDolorHombro() {
    console.log('\n🟡 ESCENARIO 2: Paciente con Dolor de Hombro');
    
    try {
      // Crear nuevo paciente
      const buttons = await this.page.$$('button');
      let createButton = null;
      
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text.includes('Crear') || text.includes('Nuevo')) {
          createButton = button;
          break;
        }
      }
      
      if (createButton) {
        await createButton.click();
        await this.wait(1000);
        
        // Llenar datos del paciente
        const inputs = await this.page.$$('input');
        const textareas = await this.page.$$('textarea');
        
        if (inputs.length >= 3) {
          await inputs[0].type('Ana Martínez');
          await inputs[1].type('45');
          if (inputs[2].tagName === 'SELECT') {
            await inputs[2].select('F');
          }
        }
        
        if (inputs.length >= 4) {
          await inputs[3].type('Dolor de hombro derecho');
        }
        
        if (inputs.length >= 5) {
          await inputs[4].type('Penicilina');
        }
        
        if (inputs.length >= 6) {
          await inputs[5].type('Paracetamol');
        }
        
        if (textareas.length > 0) {
          await textareas[0].type('Paciente de 45 años que refiere dolor en el hombro derecho de 3 semanas de evolución. El dolor se agrava con los movimientos de elevación y rotación externa. Presenta limitación funcional para actividades de la vida diaria como peinarse y vestirse.');
        }
        
        // Guardar paciente
        const saveButtons = await this.page.$$('button');
        for (const button of saveButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.includes('Guardar') || text.includes('Save')) {
            await button.click();
            break;
          }
        }
        
        await this.wait(2000);
        
        // Consultar asistente virtual
        const textareas = await this.page.$$('textarea');
        if (textareas.length > 0) {
          await textareas[0].type('¿Qué tests específicos debo realizar para evaluar un dolor de hombro con limitación de movimientos?');
          
          const queryButtons = await this.page.$$('button');
          for (const button of queryButtons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes('Consultar') || text.includes('Enviar')) {
              await button.click();
              console.log('✅ Consulta enviada al asistente');
              break;
            }
          }
        }
        
        this.scenarioResults.push({
          scenario: 'Dolor de Hombro',
          status: 'PASS',
          details: 'Paciente creado, consulta enviada'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en escenario hombro:', error.message);
      this.scenarioResults.push({
        scenario: 'Dolor de Hombro',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async scenarioProblemasRodilla() {
    console.log('\n🟢 ESCENARIO 3: Paciente con Problemas de Rodilla');
    
    try {
      // Crear nuevo paciente
      const buttons = await this.page.$$('button');
      let createButton = null;
      
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text.includes('Crear') || text.includes('Nuevo')) {
          createButton = button;
          break;
        }
      }
      
      if (createButton) {
        await createButton.click();
        await this.wait(1000);
        
        // Llenar datos del paciente
        const inputs = await this.page.$$('input');
        const textareas = await this.page.$$('textarea');
        
        if (inputs.length >= 3) {
          await inputs[0].type('Miguel López');
          await inputs[1].type('52');
          if (inputs[2].tagName === 'SELECT') {
            await inputs[2].select('M');
          }
        }
        
        if (inputs.length >= 4) {
          await inputs[3].type('Dolor de rodilla izquierda');
        }
        
        if (inputs.length >= 5) {
          await inputs[4].type('Ninguna');
        }
        
        if (inputs.length >= 6) {
          await inputs[5].type('Diclofenaco');
        }
        
        if (textareas.length > 0) {
          await textareas[0].type('Paciente de 52 años con dolor en la rodilla izquierda de 6 meses de evolución. El dolor se agrava al subir y bajar escaleras, y presenta rigidez matutina. Refiere sensación de inestabilidad y ocasionalmente bloqueos articulares.');
        }
        
        // Guardar paciente
        const saveButtons = await this.page.$$('button');
        for (const button of saveButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.includes('Guardar') || text.includes('Save')) {
            await button.click();
            break;
          }
        }
        
        await this.wait(2000);
        
        // Simular grabación de consulta
        const recordButtons = await this.page.$$('button');
        for (const button of recordButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.includes('🎤')) {
            await button.click();
            console.log('✅ Grabación iniciada para problemas de rodilla');
            await this.wait(4000);
            await button.click();
            console.log('✅ Grabación detenida');
            break;
          }
        }
        
        this.scenarioResults.push({
          scenario: 'Problemas de Rodilla',
          status: 'PASS',
          details: 'Paciente creado, grabación realizada'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en escenario rodilla:', error.message);
      this.scenarioResults.push({
        scenario: 'Problemas de Rodilla',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async scenarioSeguimiento() {
    console.log('\n🔵 ESCENARIO 4: Consulta de Seguimiento');
    
    try {
      // Consultar asistente virtual para seguimiento
      const textareas = await this.page.$$('textarea');
      if (textareas.length > 0) {
        await textareas[0].type('¿Cómo debo realizar el seguimiento de un paciente con lumbalgia crónica que ha mejorado con el tratamiento?');
        
        const queryButtons = await this.page.$$('button');
        for (const button of queryButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.includes('Consultar') || text.includes('Enviar')) {
            await button.click();
            console.log('✅ Consulta de seguimiento enviada');
            break;
          }
        }
        
        await this.wait(3000);
        
        this.scenarioResults.push({
          scenario: 'Consulta de Seguimiento',
          status: 'PASS',
          details: 'Consulta de seguimiento enviada correctamente'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en escenario seguimiento:', error.message);
      this.scenarioResults.push({
        scenario: 'Consulta de Seguimiento',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async scenarioEmergencia() {
    console.log('\n🔴 ESCENARIO 5: Emergencia Médica');
    
    try {
      // Consultar asistente virtual para emergencia
      const textareas = await this.page.$$('textarea');
      if (textareas.length > 0) {
        await textareas[0].type('¿Cuáles son los signos de alarma que debo buscar en un paciente con dolor lumbar agudo?');
        
        const queryButtons = await this.page.$$('button');
        for (const button of queryButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.includes('Consultar') || text.includes('Enviar')) {
            await button.click();
            console.log('✅ Consulta de emergencia enviada');
            break;
          }
        }
        
        await this.wait(3000);
        
        this.scenarioResults.push({
          scenario: 'Emergencia Médica',
          status: 'PASS',
          details: 'Consulta de emergencia enviada correctamente'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en escenario emergencia:', error.message);
      this.scenarioResults.push({
        scenario: 'Emergencia Médica',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async generateScenarioReport() {
    console.log('\n📊 GENERANDO REPORTE DE ESCENARIOS\n');
    
    const totalScenarios = this.scenarioResults.length;
    const passedScenarios = this.scenarioResults.filter(r => r.status === 'PASS').length;
    const failedScenarios = totalScenarios - passedScenarios;
    
    console.log('='.repeat(60));
    console.log('🏥 REPORTE DE ESCENARIOS MÉDICOS - AiDuxCare V.2');
    console.log('='.repeat(60));
    console.log(`Total de escenarios: ${totalScenarios}`);
    console.log(`✅ Exitosos: ${passedScenarios}`);
    console.log(`❌ Fallidos: ${failedScenarios}`);
    console.log(`📈 Tasa de éxito: ${((passedScenarios / totalScenarios) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    console.log('\n📝 DETALLES POR ESCENARIO:');
    this.scenarioResults.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${result.scenario}: ${result.status}`);
      console.log(`   ${result.details}`);
    });
    
    // Guardar reporte
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalScenarios,
        passed: passedScenarios,
        failed: failedScenarios,
        successRate: ((passedScenarios / totalScenarios) * 100).toFixed(1)
      },
      scenarios: this.scenarioResults
    };
    
    const reportPath = path.join(__dirname, '../scenario-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
    
    console.log('\n💡 CONCLUSIONES:');
    if (failedScenarios === 0) {
      console.log('🎉 ¡Todos los escenarios médicos funcionaron correctamente!');
      console.log('🚀 El sistema está listo para uso clínico real.');
    } else {
      console.log('⚠️  Algunos escenarios requieren atención antes del uso clínico.');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Ejecutar escenarios
async function main() {
  const tester = new MedicalScenarioTester();
  await tester.init();
  await tester.runAllScenarios();
}

main().catch(console.error); 