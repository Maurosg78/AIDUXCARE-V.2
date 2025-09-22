const fs = require('fs');

// Fix the mapper to handle array responses
const mapperFile = 'src/utils/vertexFieldMapper.ts';
let mapper = fs.readFileSync(mapperFile, 'utf8');

// Add array handling at the beginning of the function
mapper = mapper.replace(
  'export function mapVertexToSpanish(vertexData: any): any {',
  `export function mapVertexToSpanish(vertexData: any): any {
  // Handle if Vertex returns an array - take first element
  if (Array.isArray(vertexData) && vertexData.length > 0) {
    console.log('[MAPPER] Received array, extracting first element');
    vertexData = vertexData[0];
  }`
);

// Fix medication field to look for medications_reported
mapper = mapper.replace(
  "'current_medications_reported',",
  "'medications_reported',  // THIS IS THE ACTUAL FIELD NAME"
);

fs.writeFileSync(mapperFile, mapper);
console.log('✅ Fixed array handling and medications_reported field');
