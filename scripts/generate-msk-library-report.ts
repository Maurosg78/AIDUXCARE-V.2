/**
 * MSK Test Library Report Generator
 * 
 * Generates a comprehensive report of the MSK test library including:
 * - Tests organized by segment
 * - Complete test details (id, segment, name, description, fields, normalTemplate)
 * - Suggested missing tests (non-diagnostic)
 * - Prioritization for next iterations
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import { MSK_TEST_LIBRARY, regions, regionLabels, type MSKRegion, type MskTestDefinition, hasFieldDefinitions } from '../src/core/msk-tests/library/mskTestLibrary';

interface TestReport {
  id: string;
  segment: MSKRegion;
  name: string;
  description: string;
  hasFields: boolean;
  fieldCount: number;
  fields?: Array<{
    id: string;
    kind: string;
    label: string;
    unit?: string;
  }>;
  normalTemplate: string;
  sensitivity?: string;
  specificity?: string;
}

interface SegmentSummary {
  region: MSKRegion;
  label: string;
  testCount: number;
  testsWithFields: number;
  testsWithoutFields: number;
}

interface SuggestedTest {
  name: string;
  segment: MSKRegion;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

function generateReport(): string {
  const lines: string[] = [];
  
  // Header
  lines.push('# MSK Test Library Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Total Tests:** ${MSK_TEST_LIBRARY.length}`);
  lines.push('');
  
  // Process all tests
  const testsBySegment: Record<MSKRegion, TestReport[]> = {} as any;
  const segmentSummaries: SegmentSummary[] = [];
  
  // Initialize segments
  regions.forEach(region => {
    testsBySegment[region] = [];
  });
  
  // Process each test
  MSK_TEST_LIBRARY.forEach(test => {
    const hasFields = hasFieldDefinitions(test);
    const report: TestReport = {
      id: test.id,
      segment: test.region,
      name: test.name,
      description: test.description,
      hasFields: hasFields,
      fieldCount: hasFields ? (test.fields?.length || 0) : 0,
      fields: hasFields ? test.fields?.map(f => ({
        id: f.id,
        kind: f.kind,
        label: f.label,
        unit: f.unit,
      })) : undefined,
      normalTemplate: test.normalTemplate || test.defaultNormalNotes || 'Not specified',
      sensitivity: test.sensitivity || test.sensitivityQualitative,
      specificity: test.specificity || test.specificityQualitative,
    };
    
    testsBySegment[test.region].push(report);
  });
  
  // Generate segment summaries
  regions.forEach(region => {
    const tests = testsBySegment[region];
    const withFields = tests.filter(t => t.hasFields).length;
    const withoutFields = tests.filter(t => !t.hasFields).length;
    
    segmentSummaries.push({
      region,
      label: regionLabels[region],
      testCount: tests.length,
      testsWithFields: withFields,
      testsWithoutFields: withoutFields,
    });
  });
  
  // Summary Table
  lines.push('## Summary by Segment');
  lines.push('');
  lines.push('| Segment | Total Tests | With Fields | Without Fields |');
  lines.push('|---------|-------------|-------------|----------------|');
  segmentSummaries.forEach(summary => {
    lines.push(`| ${summary.label} | ${summary.testCount} | ${summary.testsWithFields} | ${summary.testsWithoutFields} |`);
  });
  lines.push('');
  
  // Detailed Tests by Segment
  lines.push('## Detailed Tests by Segment');
  lines.push('');
  
  regions.forEach(region => {
    const tests = testsBySegment[region];
    if (tests.length === 0) return;
    
    lines.push(`### ${regionLabels[region]} (${tests.length} test${tests.length > 1 ? 's' : ''})`);
    lines.push('');
    
    tests.forEach((test, index) => {
      lines.push(`#### ${index + 1}. ${test.name}`);
      lines.push('');
      lines.push(`- **ID:** \`${test.id}\``);
      lines.push(`- **Segment:** ${regionLabels[test.segment]}`);
      lines.push(`- **Description:** ${test.description}`);
      lines.push(`- **Has Specific Fields:** ${test.hasFields ? '✅ Yes' : '❌ No (legacy)'}`);
      
      if (test.hasFields && test.fields && test.fields.length > 0) {
        lines.push(`- **Field Count:** ${test.fieldCount}`);
        lines.push(`- **Fields:**`);
        test.fields.forEach(field => {
          const unitText = field.unit ? ` (${field.unit})` : '';
          lines.push(`  - \`${field.id}\`: ${field.label}${unitText} [${field.kind}]`);
        });
      }
      
      lines.push(`- **Normal Template:** ${test.normalTemplate}`);
      
      if (test.sensitivity || test.specificity) {
        lines.push(`- **Sensitivity:** ${test.sensitivity || 'Not specified'}`);
        lines.push(`- **Specificity:** ${test.specificity || 'Not specified'}`);
      }
      
      lines.push('');
    });
  });
  
  // Suggested Missing Tests
  lines.push('## Suggested Missing Tests (Non-Diagnostic)');
  lines.push('');
  lines.push('These tests are commonly used in physiotherapy practice and could enhance the library:');
  lines.push('');
  
  const suggestedTests: SuggestedTest[] = [
    // Shoulder
    {
      name: 'Yergason Test',
      segment: 'shoulder',
      description: 'Assesses biceps tendon involvement with resisted supination and elbow flexion.',
      priority: 'medium',
      reason: 'Common test for biceps tendinopathy, complements existing shoulder tests.',
    },
    {
      name: 'Speed\'s Test',
      segment: 'shoulder',
      description: 'Resisted forward flexion with elbow extended to assess biceps tendon.',
      priority: 'medium',
      reason: 'Alternative biceps test, useful for comparison.',
    },
    {
      name: 'Scapular Assistance Test',
      segment: 'shoulder',
      description: 'Manual assistance to scapula during arm elevation to assess scapular contribution.',
      priority: 'low',
      reason: 'Useful for scapular dyskinesia assessment.',
    },
    
    // Cervical
    {
      name: 'Cervical Distraction Test',
      segment: 'cervical',
      description: 'Manual traction to assess relief of radicular symptoms.',
      priority: 'high',
      reason: 'Important test for cervical radiculopathy, complements Spurling test.',
    },
    {
      name: 'Cervical Flexion Test',
      segment: 'cervical',
      description: 'Active cervical flexion to assess upper cervical involvement.',
      priority: 'medium',
      reason: 'Useful for cervicogenic headache assessment.',
    },
    
    // Lumbar
    {
      name: 'Prone Knee Bend (PKB)',
      segment: 'lumbar',
      description: 'Neurodynamic test for femoral nerve tension.',
      priority: 'high',
      reason: 'Complements SLR for L2-L4 nerve root assessment.',
    },
    {
      name: 'Quadrant Test',
      segment: 'lumbar',
      description: 'Combined extension, rotation, and lateral flexion to assess facet joint involvement.',
      priority: 'medium',
      reason: 'Useful for mechanical low back pain assessment.',
    },
    
    // Knee
    {
      name: 'Pivot Shift Test',
      segment: 'knee',
      description: 'Dynamic test for anterolateral rotatory instability.',
      priority: 'high',
      reason: 'Gold standard for ACL injury, complements Lachman test.',
    },
    {
      name: 'Apley Compression Test',
      segment: 'knee',
      description: 'Meniscal assessment with compression and rotation.',
      priority: 'medium',
      reason: 'Complements McMurray test for meniscal assessment.',
    },
    {
      name: 'Thessaly Test',
      segment: 'knee',
      description: 'Weight-bearing rotation test for meniscal involvement.',
      priority: 'medium',
      reason: 'Functional test for meniscal assessment.',
    },
    
    // Ankle
    {
      name: 'Squeeze Test',
      segment: 'ankle',
      description: 'Compression of tibia and fibula to assess syndesmosis integrity.',
      priority: 'high',
      reason: 'Important for high ankle sprain assessment.',
    },
    {
      name: 'External Rotation Test',
      segment: 'ankle',
      description: 'External rotation stress to assess syndesmosis and deltoid ligament.',
      priority: 'high',
      reason: 'Complements squeeze test for syndesmosis assessment.',
    },
    
    // Hip
    {
      name: 'Thomas Test',
      segment: 'hip',
      description: 'Assesses hip flexor tightness and hip extension range.',
      priority: 'high',
      reason: 'Fundamental test for hip flexor assessment.',
    },
    {
      name: 'Ober\'s Test',
      segment: 'hip',
      description: 'Assesses IT band tightness and hip abductor flexibility.',
      priority: 'medium',
      reason: 'Common test for lateral hip pain.',
    },
    
    // Wrist/Hand
    {
      name: 'Phalen\'s Test',
      segment: 'wrist',
      description: 'Wrist flexion to assess median nerve compression (carpal tunnel).',
      priority: 'high',
      reason: 'Essential test for carpal tunnel syndrome assessment.',
    },
    {
      name: 'Tinel\'s Sign (Wrist)',
      segment: 'wrist',
      description: 'Percussion over median nerve to assess for carpal tunnel syndrome.',
      priority: 'high',
      reason: 'Complements Phalen\'s test for carpal tunnel assessment.',
    },
    {
      name: 'Watson Test',
      segment: 'wrist',
      description: 'Scaphoid shift test for scapholunate instability.',
      priority: 'medium',
      reason: 'Important for wrist instability assessment.',
    },
    
    // Thoracic
    {
      name: 'Thoracic Rotation ROM',
      segment: 'thoracic',
      description: 'Active and passive thoracic rotation range of motion assessment.',
      priority: 'high',
      reason: 'Fundamental mobility assessment for thoracic spine.',
    },
    {
      name: 'Thoracic Extension ROM',
      segment: 'thoracic',
      description: 'Active and passive thoracic extension range of motion assessment.',
      priority: 'medium',
      reason: 'Important for postural assessment.',
    },
  ];
  
  // Group by priority
  const highPriority = suggestedTests.filter(t => t.priority === 'high');
  const mediumPriority = suggestedTests.filter(t => t.priority === 'medium');
  const lowPriority = suggestedTests.filter(t => t.priority === 'low');
  
  lines.push('### High Priority');
  lines.push('');
  lines.push('| Test Name | Segment | Description | Reason |');
  lines.push('|-----------|---------|-------------|--------|');
  highPriority.forEach(test => {
    lines.push(`| ${test.name} | ${regionLabels[test.segment]} | ${test.description} | ${test.reason} |`);
  });
  lines.push('');
  
  lines.push('### Medium Priority');
  lines.push('');
  lines.push('| Test Name | Segment | Description | Reason |');
  lines.push('|-----------|---------|-------------|--------|');
  mediumPriority.forEach(test => {
    lines.push(`| ${test.name} | ${regionLabels[test.segment]} | ${test.description} | ${test.reason} |`);
  });
  lines.push('');
  
  lines.push('### Low Priority');
  lines.push('');
  lines.push('| Test Name | Segment | Description | Reason |');
  lines.push('|-----------|---------|-------------|--------|');
  lowPriority.forEach(test => {
    lines.push(`| ${test.name} | ${regionLabels[test.segment]} | ${test.description} | ${test.reason} |`);
  });
  lines.push('');
  
  // Prioritization for Next Iterations
  lines.push('## Prioritization for Next Iterations');
  lines.push('');
  lines.push('### Phase 1 (Immediate - High Priority)');
  lines.push('');
  lines.push('Focus on completing essential tests for common conditions:');
  lines.push('');
  lines.push('1. **Cervical:** Cervical Distraction Test (complements Spurling)');
  lines.push('2. **Lumbar:** Prone Knee Bend (complements SLR for L2-L4)');
  lines.push('3. **Knee:** Pivot Shift Test (gold standard for ACL)');
  lines.push('4. **Ankle:** Squeeze Test + External Rotation Test (syndesmosis)');
  lines.push('5. **Hip:** Thomas Test (fundamental hip flexor assessment)');
  lines.push('6. **Wrist:** Phalen\'s Test + Tinel\'s Sign (carpal tunnel)');
  lines.push('7. **Thoracic:** Thoracic Rotation ROM (fundamental mobility)');
  lines.push('');
  
  lines.push('### Phase 2 (Short-term - Medium Priority)');
  lines.push('');
  lines.push('Expand coverage for less common but important conditions:');
  lines.push('');
  lines.push('1. **Shoulder:** Yergason, Speed\'s Test (biceps assessment)');
  lines.push('2. **Cervical:** Cervical Flexion Test (headache assessment)');
  lines.push('3. **Lumbar:** Quadrant Test (facet joint assessment)');
  lines.push('4. **Knee:** Apley Compression, Thessaly (meniscal assessment)');
  lines.push('5. **Hip:** Ober\'s Test (IT band assessment)');
  lines.push('6. **Wrist:** Watson Test (instability assessment)');
  lines.push('7. **Thoracic:** Thoracic Extension ROM (postural assessment)');
  lines.push('');
  
  lines.push('### Phase 3 (Long-term - Low Priority)');
  lines.push('');
  lines.push('Specialized tests for specific conditions:');
  lines.push('');
  lines.push('1. **Shoulder:** Scapular Assistance Test (scapular dyskinesia)');
  lines.push('2. Additional specialized tests as clinical needs arise');
  lines.push('');
  
  // Statistics
  lines.push('## Library Statistics');
  lines.push('');
  const totalWithFields = MSK_TEST_LIBRARY.filter(t => hasFieldDefinitions(t)).length;
  const totalWithoutFields = MSK_TEST_LIBRARY.length - totalWithFields;
  const totalFields = MSK_TEST_LIBRARY
    .filter(t => hasFieldDefinitions(t))
    .reduce((sum, t) => sum + (t.fields?.length || 0), 0);
  
  lines.push(`- **Total Tests:** ${MSK_TEST_LIBRARY.length}`);
  lines.push(`- **Tests with Specific Fields:** ${totalWithFields} (${Math.round(totalWithFields / MSK_TEST_LIBRARY.length * 100)}%)`);
  lines.push(`- **Legacy Tests (without fields):** ${totalWithoutFields} (${Math.round(totalWithoutFields / MSK_TEST_LIBRARY.length * 100)}%)`);
  lines.push(`- **Total Field Definitions:** ${totalFields}`);
  lines.push(`- **Average Fields per Test (with fields):** ${totalWithFields > 0 ? Math.round(totalFields / totalWithFields * 10) / 10 : 0}`);
  lines.push('');
  
  return lines.join('\n');
}

// Generate and output report
const report = generateReport();
console.log(report);

// Optionally write to file
import { writeFileSync } from 'fs';
import { join } from 'path';

const outputPath = join(process.cwd(), 'docs', 'msk-test-library-report.md');
writeFileSync(outputPath, report, 'utf-8');
console.log(`\n✅ Report written to: ${outputPath}`);

