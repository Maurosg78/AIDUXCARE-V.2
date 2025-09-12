// En el return del componente, agregar al final antes del último </div>:

return (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-6xl mx-auto p-6">
      {/* ... resto del contenido ... */}
    </div>
    
    {/* Contador flotante de créditos */}
    <FloatingCreditsCounter current={credits} total={150} />
  </div>
);
