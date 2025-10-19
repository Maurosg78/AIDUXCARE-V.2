#!/bin/bash

FILE="src/components/WorkflowAnalysisTab.tsx"

# Crear versión limpia sin duplicados
cat > ${FILE}.clean << 'ENDFILE'
import React, { useEffect, useState } from 'react';
import { useNiagaraProcessorV2 } from "../hooks/useNiagaraProcessor-v2";
import ValidationMetrics from "./ValidationMetrics";
import { useAutoSelection } from "../hooks/useAutoSelection";
ENDFILE

# Agregar el resto del archivo sin las primeras líneas duplicadas
sed -n '9,$p' $FILE >> ${FILE}.clean

# Reemplazar archivo
mv ${FILE}.clean $FILE

echo "✅ Imports duplicados eliminados"
