// @ts-nocheck
/**
 * 🏙️ Ciudades de España - AiDuxCare V.2
 * Lista completa de ciudades españolas ordenadas alfabéticamente
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

export interface SpanishCity {
  id: string;
  name: string;
  province: string;
  provinceCode: string;
  population?: number;
  region: string;
}

export const SPANISH_CITIES: SpanishCity[] = [
  // A
  { id: 'albacete', name: 'Albacete', province: 'Albacete', provinceCode: 'AB', region: 'Castilla-La Mancha' },
  { id: 'alcala-de-henares', name: 'Alcalá de Henares', province: 'Madrid', provinceCode: 'M', region: 'Madrid' },
  { id: 'alcorcon', name: 'Alcorcón', province: 'Madrid', provinceCode: 'M', region: 'Madrid' },
  { id: 'alicante', name: 'Alicante', province: 'Alicante', provinceCode: 'A', region: 'Comunidad Valenciana' },
  { id: 'almeria', name: 'Almería', province: 'Almería', provinceCode: 'AL', region: 'Andalucía' },
  { id: 'alzira', name: 'Alzira', province: 'Valencia', provinceCode: 'V', region: 'Comunidad Valenciana' },
  { id: 'aranda-de-duero', name: 'Aranda de Duero', province: 'Burgos', provinceCode: 'BU', region: 'Castilla y León' },
  { id: 'avila', name: 'Ávila', province: 'Ávila', provinceCode: 'AV', region: 'Castilla y León' },

  // B
  { id: 'badajoz', name: 'Badajoz', province: 'Badajoz', provinceCode: 'BA', region: 'Extremadura' },
  { id: 'barcelona', name: 'Barcelona', province: 'Barcelona', provinceCode: 'B', region: 'Cataluña' },
  { id: 'bilbao', name: 'Bilbao', province: 'Vizcaya', provinceCode: 'BI', region: 'País Vasco' },
  { id: 'burgos', name: 'Burgos', province: 'Burgos', provinceCode: 'BU', region: 'Castilla y León' },

  // C
  { id: 'cadiz', name: 'Cádiz', province: 'Cádiz', provinceCode: 'CA', region: 'Andalucía' },
  { id: 'caceres', name: 'Cáceres', province: 'Cáceres', provinceCode: 'CC', region: 'Extremadura' },
  { id: 'cartagena', name: 'Cartagena', province: 'Murcia', provinceCode: 'MU', region: 'Región de Murcia' },
  { id: 'castellon-de-la-plana', name: 'Castellón de la Plana', province: 'Castellón', provinceCode: 'CS', region: 'Comunidad Valenciana' },
  { id: 'ceuta', name: 'Ceuta', province: 'Ceuta', provinceCode: 'CE', region: 'Ceuta' },
  { id: 'cordoba', name: 'Córdoba', province: 'Córdoba', provinceCode: 'CO', region: 'Andalucía' },
  { id: 'cuenca', name: 'Cuenca', province: 'Cuenca', provinceCode: 'CU', region: 'Castilla-La Mancha' },

  // D
  { id: 'donostia-san-sebastian', name: 'Donostia-San Sebastián', province: 'Guipúzcoa', provinceCode: 'SS', region: 'País Vasco' },

  // E
  { id: 'elche', name: 'Elche', province: 'Alicante', provinceCode: 'A', region: 'Comunidad Valenciana' },

  // F
  { id: 'ferrol', name: 'Ferrol', province: 'La Coruña', provinceCode: 'C', region: 'Galicia' },
  { id: 'fuenlabrada', name: 'Fuenlabrada', province: 'Madrid', provinceCode: 'M', region: 'Madrid' },

  // G
  { id: 'gandia', name: 'Gandía', province: 'Valencia', provinceCode: 'V', region: 'Comunidad Valenciana' },
  { id: 'gijon', name: 'Gijón', province: 'Asturias', provinceCode: 'O', region: 'Principado de Asturias' },
  { id: 'granada', name: 'Granada', province: 'Granada', provinceCode: 'GR', region: 'Andalucía' },
  { id: 'guadalajara', name: 'Guadalajara', province: 'Guadalajara', provinceCode: 'GU', region: 'Castilla-La Mancha' },

  // H
  { id: 'huelva', name: 'Huelva', province: 'Huelva', provinceCode: 'H', region: 'Andalucía' },
  { id: 'huesca', name: 'Huesca', province: 'Huesca', provinceCode: 'HU', region: 'Aragón' },

  // I
  { id: 'ibiza', name: 'Ibiza', province: 'Islas Baleares', provinceCode: 'PM', region: 'Islas Baleares' },

  // J
  { id: 'jaen', name: 'Jaén', province: 'Jaén', provinceCode: 'J', region: 'Andalucía' },
  { id: 'jerez-de-la-frontera', name: 'Jerez de la Frontera', province: 'Cádiz', provinceCode: 'CA', region: 'Andalucía' },

  // L
  { id: 'la-laguna', name: 'La Laguna', province: 'Santa Cruz de Tenerife', provinceCode: 'TF', region: 'Islas Canarias' },
  { id: 'las-palmas-de-gran-canaria', name: 'Las Palmas de Gran Canaria', province: 'Las Palmas', provinceCode: 'GC', region: 'Islas Canarias' },
  { id: 'leon', name: 'León', province: 'León', provinceCode: 'LE', region: 'Castilla y León' },
  { id: 'lerida', name: 'Lérida', province: 'Lérida', provinceCode: 'L', region: 'Cataluña' },
  { id: 'logrono', name: 'Logroño', province: 'La Rioja', provinceCode: 'LO', region: 'La Rioja' },
  { id: 'lucena', name: 'Lucena', province: 'Córdoba', provinceCode: 'CO', region: 'Andalucía' },
  { id: 'lugo', name: 'Lugo', province: 'Lugo', provinceCode: 'LU', region: 'Galicia' },

  // M
  { id: 'madrid', name: 'Madrid', province: 'Madrid', provinceCode: 'M', region: 'Madrid' },
  { id: 'malaga', name: 'Málaga', province: 'Málaga', provinceCode: 'MA', region: 'Andalucía' },
  { id: 'manresa', name: 'Manresa', province: 'Barcelona', provinceCode: 'B', region: 'Cataluña' },
  { id: 'marbella', name: 'Marbella', province: 'Málaga', provinceCode: 'MA', region: 'Andalucía' },
  { id: 'mataro', name: 'Mataró', province: 'Barcelona', provinceCode: 'B', region: 'Cataluña' },
  { id: 'melilla', name: 'Melilla', province: 'Melilla', provinceCode: 'ML', region: 'Melilla' },
  { id: 'merida', name: 'Mérida', province: 'Badajoz', provinceCode: 'BA', region: 'Extremadura' },
  { id: 'mijas', name: 'Mijas', province: 'Málaga', provinceCode: 'MA', region: 'Andalucía' },
  { id: 'mijas-costa', name: 'Mijas Costa', province: 'Málaga', provinceCode: 'MA', region: 'Andalucía' },
  { id: 'mollina', name: 'Mollina', province: 'Málaga', provinceCode: 'MA', region: 'Andalucía' },
  { id: 'mostoles', name: 'Móstoles', province: 'Madrid', provinceCode: 'M', region: 'Madrid' },
  { id: 'murcia', name: 'Murcia', province: 'Murcia', provinceCode: 'MU', region: 'Región de Murcia' },

  // N
  { id: 'nijar', name: 'Níjar', province: 'Almería', provinceCode: 'AL', region: 'Andalucía' },

  // O
  { id: 'oviedo', name: 'Oviedo', province: 'Asturias', provinceCode: 'O', region: 'Principado de Asturias' },

  // P
  { id: 'palencia', name: 'Palencia', province: 'Palencia', provinceCode: 'P', region: 'Castilla y León' },
  { id: 'pamplona', name: 'Pamplona', province: 'Navarra', provinceCode: 'NA', region: 'Navarra' },
  { id: 'paterna', name: 'Paterna', province: 'Valencia', provinceCode: 'V', region: 'Comunidad Valenciana' },
  { id: 'pinto', name: 'Pinto', province: 'Madrid', provinceCode: 'M', region: 'Madrid' },
  { id: 'pinto-madrid', name: 'Pinto (Madrid)', province: 'Madrid', provinceCode: 'M', region: 'Madrid' },

  // R
  { id: 'reus', name: 'Reus', province: 'Tarragona', provinceCode: 'T', region: 'Cataluña' },
  { id: 'roquetas-de-mar', name: 'Roquetas de Mar', province: 'Almería', provinceCode: 'AL', region: 'Andalucía' },

  // S
  { id: 'sabadell', name: 'Sabadell', province: 'Barcelona', provinceCode: 'B', region: 'Cataluña' },
  { id: 'salamanca', name: 'Salamanca', province: 'Salamanca', provinceCode: 'SA', region: 'Castilla y León' },
  { id: 'san-cristobal-de-la-laguna', name: 'San Cristóbal de La Laguna', province: 'Santa Cruz de Tenerife', provinceCode: 'TF', region: 'Islas Canarias' },
  { id: 'san-sebastian', name: 'San Sebastián', province: 'Guipúzcoa', provinceCode: 'SS', region: 'País Vasco' },
  { id: 'santander', name: 'Santander', province: 'Cantabria', provinceCode: 'S', region: 'Cantabria' },
  { id: 'santiago-de-compostela', name: 'Santiago de Compostela', province: 'La Coruña', provinceCode: 'C', region: 'Galicia' },
  { id: 'segovia', name: 'Segovia', province: 'Segovia', provinceCode: 'SG', region: 'Castilla y León' },
  { id: 'sevilla', name: 'Sevilla', province: 'Sevilla', provinceCode: 'SE', region: 'Andalucía' },
  { id: 'soria', name: 'Soria', province: 'Soria', provinceCode: 'SO', region: 'Castilla y León' },

  // T
  { id: 'tarragona', name: 'Tarragona', province: 'Tarragona', provinceCode: 'T', region: 'Cataluña' },
  { id: 'teruel', name: 'Teruel', province: 'Teruel', provinceCode: 'TE', region: 'Aragón' },
  { id: 'toledo', name: 'Toledo', province: 'Toledo', provinceCode: 'TO', region: 'Castilla-La Mancha' },
  { id: 'torrevieja', name: 'Torrevieja', province: 'Alicante', provinceCode: 'A', region: 'Comunidad Valenciana' },

  // U
  { id: 'ubeda', name: 'Úbeda', province: 'Jaén', provinceCode: 'J', region: 'Andalucía' },

  // V
  { id: 'valencia', name: 'Valencia', province: 'Valencia', provinceCode: 'V', region: 'Comunidad Valenciana' },
  { id: 'valladolid', name: 'Valladolid', province: 'Valladolid', provinceCode: 'VA', region: 'Castilla y León' },
  { id: 'vigo', name: 'Vigo', province: 'Pontevedra', provinceCode: 'PO', region: 'Galicia' },
  { id: 'vitoria-gasteiz', name: 'Vitoria-Gasteiz', province: 'Álava', provinceCode: 'VI', region: 'País Vasco' },

  // Z
  { id: 'zamora', name: 'Zamora', province: 'Zamora', provinceCode: 'ZA', region: 'Castilla y León' },
  { id: 'zaragoza', name: 'Zaragoza', province: 'Zaragoza', provinceCode: 'Z', region: 'Aragón' }
];

/**
 * Obtiene ciudades por provincia
 */
export const getCitiesByProvince = (provinceCode: string): SpanishCity[] => {
  return SPANISH_CITIES.filter(city => city.provinceCode === provinceCode);
};

/**
 * Obtiene ciudades por región
 */
export const getCitiesByRegion = (region: string): SpanishCity[] => {
  return SPANISH_CITIES.filter(city => city.region === region);
};

/**
 * Busca ciudades por nombre (búsqueda parcial)
 */
export const searchCities = (query: string): SpanishCity[] => {
  const searchTerm = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return SPANISH_CITIES.filter(city => 
    city.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchTerm)
  );
};

/**
 * Obtiene las ciudades más pobladas
 */
export const getMajorCities = (): SpanishCity[] => {
  return SPANISH_CITIES.filter(city => 
    ['madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'malaga', 'murcia', 'palma', 'las-palmas-de-gran-canaria', 'bilbao'].includes(city.id)
  );
}; 