// Debug del contexto de paciente
const input = 'Este paciente tiene dolor en la rodilla';
console.log('Input original:', input);

// Simular el proceso paso a paso
let sanitized = input;

// Paso 1: Reemplazar "este" por "[PACIENTE]"
sanitized = sanitized.replace(/\b(este|este paciente|él|ella)\b/gi, '[PACIENTE]');
console.log('Después de reemplazar "este":', sanitized);

// Paso 2: Reemplazar "[PACIENTE] paciente" por "[PACIENTE]"
sanitized = sanitized.replace(/\b\[PACIENTE\]\s+(paciente)/gi, '[PACIENTE]');
console.log('Después de reemplazar "[PACIENTE] paciente":', sanitized);

// Paso 3: Reemplazar "paciente [PACIENTE]" por "[PACIENTE]"
sanitized = sanitized.replace(/\b(paciente)\s+\[PACIENTE\]/gi, '[PACIENTE]');
console.log('Después de reemplazar "paciente [PACIENTE]":', sanitized);

console.log('Resultado final:', sanitized);
console.log('Esperado:', '[PACIENTE] tiene dolor en la rodilla');
console.log('¿Coincide?', sanitized === '[PACIENTE] tiene dolor en la rodilla');
