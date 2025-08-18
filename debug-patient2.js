// Debug más directo del regex
const input = 'Este paciente tiene dolor en la rodilla';
console.log('Input original:', input);

let sanitized = input;

// Paso 1: Reemplazar "este" por "[PACIENTE]"
sanitized = sanitized.replace(/\b(este|este paciente|él|ella)\b/gi, '[PACIENTE]');
console.log('Después de reemplazar "este":', sanitized);

// Paso 2: Debug del regex que no funciona
const testText = '[PACIENTE] paciente tiene dolor en la rodilla';
console.log('Test text:', testText);

const regex = /\[PACIENTE\]\s+(paciente)/gi;
console.log('Regex:', regex);
console.log('¿Match?', regex.test(testText));

// Probar diferentes variaciones
console.log('Reemplazo 1:', testText.replace(/\[PACIENTE\]\s+(paciente)/gi, '[PACIENTE]'));
console.log('Reemplazo 2:', testText.replace(/\[PACIENTE\]\s+paciente/gi, '[PACIENTE]'));
console.log('Reemplazo 3:', testText.replace(/\[PACIENTE\] paciente/gi, '[PACIENTE]'));
