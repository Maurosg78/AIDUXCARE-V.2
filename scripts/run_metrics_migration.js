#!/usr/bin/env node
/* eslint-env node */

/**
 * Script para ejecutar la migración de la tabla metrics_by_visit en Supabase
 * 
 * Este script lee el archivo create_metrics_table.sql y lo ejecuta en la base de datos
 * Supabase para crear la tabla, índices y políticas necesarias.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Verificar que tenemos las credenciales necesarias
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Se requieren las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY o SUPABASE_ANON_KEY');
  process.exit(1);
}

// Utilizar el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración de tabla metrics_by_visit...');

    // Leer el archivo SQL
    const sqlFilePath = join(__dirname, 'create_metrics_table.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf-8');

    // Ejecutar la consulta SQL directamente
    console.log('⚠️ Nota: Este script requiere conectarse a la base de datos Supabase directamente.');
    console.log('⚠️ Puedes ejecutar este SQL manualmente en el Editor SQL de Supabase:');
    console.log('-----------------------------------------------');
    console.log(sqlContent);
    console.log('-----------------------------------------------');
    
    console.log('ℹ️ Intentando verificar si la tabla metrics_by_visit existe...');

    // Verificar que la tabla existe
    const { data, error: verifyError } = await supabase
      .from('metrics_by_visit')
      .select('id')
      .limit(1);

    if (verifyError) {
      if (verifyError.code === 'PGRST204') {
        console.log('⚠️ La tabla metrics_by_visit existe pero está vacía.');
      } else if (verifyError.code === 'PGRST405') {
        console.error('❌ La tabla metrics_by_visit no existe. Por favor, ejecuta el SQL en Supabase.');
      } else {
        console.warn('⚠️ No se pudo verificar la tabla: ' + verifyError.message);
      }
    } else {
      console.log(`✅ Verificación exitosa. La tabla metrics_by_visit existe ${data ? 'y contiene datos.' : 'pero está vacía.'}`);
    }

    // Generar métricas para Andrea Bultó si se especifica
    if (process.argv.includes('--generate-andrea-metrics')) {
      console.log('🔄 Generando métricas para Andrea Bultó...');
      
      // Importar y ejecutar el script de forma dinámica
      try {
        // Utilizamos dynamic import para módulos ESM
        const generateMetricsModule = await import('./generateAndreaMetrics.js');
        await generateMetricsModule.default();
        console.log('✅ Métricas para Andrea Bultó generadas exitosamente.');
      } catch (err) {
        console.error('❌ Error al generar métricas para Andrea Bultó:', err);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar la migración
runMigration(); 