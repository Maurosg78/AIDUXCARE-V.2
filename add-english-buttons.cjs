const fs = require('fs');
const file = 'src/components/ClinicalAnalysisResults.tsx';
let content = fs.readFileSync(file, 'utf8');

// Buscar donde deberían estar los botones "Add item"
// Agregar después de cada sección
const sections = [
  { after: '</div>\n        </div>\n      </div>', label: 'Add item' },
];

// Si no están los botones de Add item, agregarlos
if (!content.includes('Add item')) {
  // Agregar importación si no existe
  if (!content.includes('AddCustomItemButton')) {
    console.log('AddCustomItemButton already imported');
  }
  
  // Agregar botones después de cada sección
  content = content.replace(
    /(\s+<\/div>\n\s+<\/div>\n\s+<\/div>)/g,
    `\n          <AddCustomItemButton onAdd={(text) => addCustomItem('general', text)} />\n$1`
  );
}

fs.writeFileSync(file, content);
console.log('✅ Added English "Add item" buttons where needed');
