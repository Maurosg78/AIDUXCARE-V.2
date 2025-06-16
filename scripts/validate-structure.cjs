const fs = require('fs');
const path = require('path');

// 📏 SCRIPT DE VALIDACIÓN DE ESTRUCTURA DE ARCHIVOS
// Verifica que la estructura del proyecto cumpla con las políticas establecidas

console.log('📏 INICIANDO VALIDACIÓN DE ESTRUCTURA DE ARCHIVOS\n');

class StructureValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.summary = {
      totalChecks: 0,
      passedChecks: 0,
      violations: 0,
      warnings: 0,
      score: 0
    };
    
    // Estructura obligatoria
    this.requiredDirectories = [
      'src',
      'public',
      'scripts',
      'config'
    ];
    
    this.requiredFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'README.md'
    ];
    
    // Patrones prohibidos
    this.prohibitedPatterns = [
      { pattern: /\.backup\./, severity: 'violation', reason: 'Archivo backup prohibido' },
      { pattern: /\.old\./, severity: 'violation', reason: 'Archivo .old prohibido' },
      { pattern: /\.temp\./, severity: 'warning', reason: 'Archivo temporal' },
      { pattern: /-copy\./, severity: 'warning', reason: 'Archivo copia' },
      { pattern: /^temp\//, severity: 'violation', reason: 'Directorio temp/ prohibido' },
      { pattern: /^backup\//, severity: 'violation', reason: 'Directorio backup/ prohibido' },
      { pattern: /^old\//, severity: 'violation', reason: 'Directorio old/ prohibido' },
      { pattern: /^deprecated\//, severity: 'violation', reason: 'Directorio deprecated/ prohibido' }
    ];
    
    // Documentación permitida
    this.allowedDocumentation = [
      'README.md',
      'docs/ARCHITECTURE.md',
      'docs/API_REFERENCE.md',
      'docs/DEPLOYMENT.md',
      '.github/DEVELOPMENT_POLICIES.md',
      // 🎯 DOCUMENTOS ESTRATÉGICOS PROTEGIDOS
      'PLAN_NEGOCIOS_AIDUXCARE_V3.md',
      'PROJECT_STATUS.md',
      'RESUMEN_DECISIONES_CEO_CTO.md',
      'INFORME_MVP_INVERSORES.md',
      'INFORME_AUDITORIA_IA.md',
      'INFORME_TECNICO_AUDITORIA_IA.md'
    ];
  }
  
  checkRequiredStructure() {
    console.log('🔍 Verificando estructura obligatoria...');
    
    // Verificar directorios requeridos
    for (const dir of this.requiredDirectories) {
      this.summary.totalChecks++;
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.summary.passedChecks++;
        console.log(`✅ Directorio requerido: ${dir}`);
      } else {
        this.violations.push({
          type: 'missing_directory',
          path: dir,
          severity: 'violation',
          reason: 'Directorio requerido faltante'
        });
        console.log(`❌ Directorio faltante: ${dir}`);
      }
    }
    
    // Verificar archivos requeridos
    for (const file of this.requiredFiles) {
      this.summary.totalChecks++;
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        this.summary.passedChecks++;
        console.log(`✅ Archivo requerido: ${file}`);
      } else {
        this.violations.push({
          type: 'missing_file',
          path: file,
          severity: 'violation',
          reason: 'Archivo requerido faltante'
        });
        console.log(`❌ Archivo faltante: ${file}`);
      }
    }
  }
  
  checkProhibitedPatterns() {
    console.log('\n🚫 Verificando patrones prohibidos...');
    
    this.scanDirectory('.', '');
  }
  
  scanDirectory(dir, basePath) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        // Skip directorios excluidos
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        // Verificar patrones prohibidos
        for (const { pattern, severity, reason } of this.prohibitedPatterns) {
          if (pattern.test(relativePath)) {
            this.summary.totalChecks++;
            
            const issue = {
              type: 'prohibited_pattern',
              path: relativePath,
              severity,
              reason
            };
            
            if (severity === 'violation') {
              this.violations.push(issue);
              this.summary.violations++;
              console.log(`❌ VIOLACIÓN: ${relativePath} - ${reason}`);
            } else {
              this.warnings.push(issue);
              this.summary.warnings++;
              console.log(`⚠️ ADVERTENCIA: ${relativePath} - ${reason}`);
            }
            
            break; // Solo reportar la primera coincidencia
          }
        }
        
        // Recursión en subdirectorios
        if (stat.isDirectory()) {
          this.scanDirectory(fullPath, relativePath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ No se pudo escanear directorio: ${dir}`);
    }
  }
  
  checkDocumentationCompliance() {
    console.log('\n📄 Verificando cumplimiento de documentación...');
    
    const allMdFiles = this.findMarkdownFiles('.');
    const excessDocumentation = [];
    
    // Lista de documentos estratégicos protegidos
    const strategicDocs = [
      'PLAN_NEGOCIOS_AIDUXCARE_V3.md',
      'PROJECT_STATUS.md',
      'RESUMEN_DECISIONES_CEO_CTO.md',
      'INFORME_MVP_INVERSORES.md',
      'INFORME_AUDITORIA_IA.md',
      'INFORME_TECNICO_AUDITORIA_IA.md'
    ];
    
    for (const mdFile of allMdFiles) {
      if (!this.allowedDocumentation.includes(mdFile)) {
        const fileName = path.basename(mdFile);
        
        // 🛡️ PROTECCIÓN: Verificar si es documento estratégico
        if (strategicDocs.includes(fileName)) {
          console.log(`🛡️ PROTEGIDO: ${mdFile} (documento estratégico)`);
          continue; // No evaluar como prohibido
        }
        
        // Verificar si es un patrón temporal prohibido
        const isTemporaryDoc = /^(INFORME_|PLAN_|RESUMEN_|IMPLEMENTACION_|MIGRACION_|CORRECCION_|HOJA_DE_RUTA_|FLUJO_|CONFIGURACION_).*\.md$/
          .test(fileName);
        
        if (isTemporaryDoc) {
          this.violations.push({
            type: 'prohibited_documentation',
            path: mdFile,
            severity: 'violation',
            reason: 'Documentación temporal prohibida'
          });
          console.log(`❌ Documentación prohibida: ${mdFile}`);
        } else {
          excessDocumentation.push(mdFile);
        }
      }
    }
    
    if (excessDocumentation.length > 0) {
      this.warnings.push({
        type: 'excess_documentation',
        path: excessDocumentation.join(', '),
        severity: 'warning',
        reason: `${excessDocumentation.length} archivo(s) de documentación no esencial`
      });
      console.log(`⚠️ Documentación excesiva: ${excessDocumentation.length} archivos`);
    }
    
    // Verificar ratio de documentación (excluyendo documentos estratégicos del conteo negativo)
    const sourceFiles = this.countSourceFiles('.');
    const nonStrategicDocs = allMdFiles.filter(file => {
      const fileName = path.basename(file);
      return !strategicDocs.includes(fileName);
    });
    const docRatio = nonStrategicDocs.length / (sourceFiles || 1);
    
    if (docRatio > 0.15) {
      this.warnings.push({
        type: 'high_documentation_ratio',
        path: 'proyecto',
        severity: 'warning',
        reason: `Ratio de documentación no estratégica muy alto: ${(docRatio * 100).toFixed(1)}% (>15%)`
      });
      console.log(`⚠️ Ratio de documentación alto: ${(docRatio * 100).toFixed(1)}%`);
    }
  }
  
  findMarkdownFiles(dir, basePath = '') {
    const mdFiles = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        if (item === 'node_modules' || item === '.git') continue;
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          mdFiles.push(...this.findMarkdownFiles(fullPath, relativePath));
        } else if (item.endsWith('.md')) {
          mdFiles.push(relativePath);
        }
      }
    } catch (error) {
      // Ignorar errores de acceso
    }
    
    return mdFiles;
  }
  
  countSourceFiles(dir, basePath = '') {
    let count = 0;
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (item === 'node_modules' || item === '.git') continue;
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          count += this.countSourceFiles(fullPath, path.join(basePath, item));
        } else if (/\.(js|ts|jsx|tsx|vue|svelte)$/.test(item)) {
          count++;
        }
      }
    } catch (error) {
      // Ignorar errores de acceso
    }
    
    return count;
  }
  
  calculateScore() {
    const totalIssues = this.violations.length + this.warnings.length;
    const maxScore = 100;
    
    // Penalizar violaciones más que advertencias
    const violationPenalty = this.violations.length * 10;
    const warningPenalty = this.warnings.length * 3;
    
    const score = Math.max(0, maxScore - violationPenalty - warningPenalty);
    
    this.summary.score = score;
    return score;
  }
  
  generateReport() {
    console.log('\n📊 REPORTE DE VALIDACIÓN DE ESTRUCTURA');
    console.log('='.repeat(50));
    
    // Ejecutar todas las verificaciones
    this.checkRequiredStructure();
    this.checkProhibitedPatterns();
    this.checkDocumentationCompliance();
    
    const score = this.calculateScore();
    
    console.log('\n📈 RESUMEN:');
    console.log(`• Score de estructura: ${score}/100`);
    console.log(`• Total de verificaciones: ${this.summary.totalChecks}`);
    console.log(`• Verificaciones pasadas: ${this.summary.passedChecks}`);
    console.log(`• Violaciones: ${this.violations.length}`);
    console.log(`• Advertencias: ${this.warnings.length}`);
    
    if (this.violations.length > 0) {
      console.log('\n🚨 VIOLACIONES CRÍTICAS:');
      this.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.path} - ${violation.reason}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ ADVERTENCIAS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.path} - ${warning.reason}`);
      });
    }
    
    // Recomendaciones
    console.log('\n📋 RECOMENDACIONES:');
    if (this.violations.length > 0) {
      console.log('🔴 ALTA PRIORIDAD: Corregir violaciones críticas inmediatamente');
    }
    if (this.warnings.length > 0) {
      console.log('🟡 MEDIA PRIORIDAD: Revisar y corregir advertencias');
    }
    if (score >= 90) {
      console.log('🟢 EXCELENTE: Estructura cumple con estándares de calidad');
    } else if (score >= 70) {
      console.log('🟡 BUENO: Estructura mayormente conforme, mejoras menores requeridas');
    } else {
      console.log('🔴 CRÍTICO: Estructura requiere mejoras significativas');
    }
    
    // Guardar reporte
    const report = {
      timestamp: new Date().toISOString(),
      score,
      summary: this.summary,
      violations: this.violations,
      warnings: this.warnings
    };
    
    const reportPath = `structure-validation-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);
    
    return report;
  }
}

// Ejecutar validación
try {
  const validator = new StructureValidator();
  const report = validator.generateReport();
  
  // Determinar código de salida
  if (report.violations.length > 0) {
    console.log('\n❌ VALIDACIÓN FALLÓ: Violaciones críticas encontradas');
    process.exit(1);
  } else if (report.warnings.length > 3) {
    console.log('\n⚠️ VALIDACIÓN CON ADVERTENCIAS: Muchas advertencias encontradas');
    process.exit(0);
  } else {
    console.log('\n✅ VALIDACIÓN EXITOSA: Estructura conforme a políticas');
    process.exit(0);
  }
  
} catch (error) {
  console.error('❌ Error durante la validación:', error.message);
  process.exit(1);
} 