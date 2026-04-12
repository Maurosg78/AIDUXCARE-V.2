import type {
  MSKRegion,
  MskTestDefinition,
  PhysicalTest,
  TestFieldDefinition,
} from './mskTestLibrary';

type LocalizedFieldCopy = {
  label?: string;
  notesPlaceholder?: string;
};

type LocalizedTestCopy = {
  name?: string;
  description?: string;
  typicalUse?: string;
  normalTemplate?: string;
  defaultNormalNotes?: string;
};

const localizedTestCopyEs: Record<string, LocalizedTestCopy> = {
  'straight-leg-raise': {
    name: 'Elevacion de pierna recta (SLR)',
    description: 'Evalua posible irritacion radicular L4-S1 mediante elevacion pasiva de la pierna.',
    typicalUse: 'Pacientes con lumbalgia irradiada hacia la extremidad inferior.',
  },
  'cervical-rotation-active': {
    name: 'Rotacion cervical activa',
    description: 'Evalua el rango de movimiento de rotacion cervical.',
    typicalUse: 'Dolor cervical mecanico y valoracion global de movilidad.',
  },
  'empty-can': {
    name: 'Prueba de Jobe',
    description: 'Evalua compromiso del supraespinoso y posible tendinopatia.',
    typicalUse: 'Pacientes con arco doloroso de hombro o sospecha de tendinopatia del supraespinoso.',
  },
  slump_lumbar: {
    name: 'Prueba de Slump',
    description: 'Prueba neurodinamica en sedestacion para irritacion radicular y tension neural en miembros inferiores.',
    typicalUse: 'Pacientes con lumbalgia irradiada, sintomas neuropaticos o sospecha de compromiso radicular.',
  },
  prone_instability_lumbar: {
    name: 'Prueba de inestabilidad en prono',
    description: 'Evalua la contribucion de la inestabilidad segmentaria lumbar al dolor en extension.',
    typicalUse: 'Pacientes con lumbalgia mecanica, especialmente si mejoran moderadamente con soporte muscular.',
  },
  'hip-faber': {
    name: 'Prueba FABER (Patrick)',
    description: 'Maniobra de flexion, abduccion y rotacion externa de cadera para valorar dolor de cadera o articulacion sacroiliaca.',
    typicalUse: 'Cribado de compromiso de cadera o sacroiliaco en dolor inguinal, gluteo o lumbar.',
  },
  'hip-fadir': {
    name: 'Prueba FADIR',
    description: 'Maniobra de flexion, aduccion y rotacion interna para provocar sintomas anteriores de cadera o ingles.',
    typicalUse: 'Valoracion de patologia intraarticular de cadera o signos de impingement femoroacetabular.',
  },
  'hip-trendelenburg': {
    name: 'Signo de Trendelenburg',
    description: 'Prueba de apoyo unipodal para observar descenso pelvico y valorar la funcion abductora de cadera.',
    typicalUse: 'Cribado de debilidad del gluteo medio o disfuncion abductora de cadera.',
  },
  'knee-lachman': {
    name: 'Prueba de Lachman',
    description: 'Prueba de traslacion anterior de la tibia respecto al femur a unos 20-30 grados para valorar la integridad del LCA.',
    typicalUse: 'Valoracion de la integridad del LCA en pacientes con inestabilidad aguda o cronica de rodilla.',
  },
  'knee-mcmurray': {
    name: 'Prueba de McMurray',
    description: 'Combinacion de flexion, extension y rotacion de rodilla para valorar clic meniscal y reproduccion de sintomas.',
    typicalUse: 'Cribado de compromiso meniscal en pacientes con dolor o bloqueo de rodilla.',
  },
  'knee-patellofemoral-grind': {
    name: 'Prueba de compresion patelofemoral (Clarke)',
    description: 'Evalua sintomas de la articulacion patelofemoral aplicando presion suave sobre la rotula durante la contraccion del cuadriceps.',
    typicalUse: 'Valoracion de dolor patelofemoral en cuadros de dolor anterior de rodilla.',
  },
  'ankle-anterior-drawer': {
    name: 'Prueba de cajon anterior de tobillo',
    description: 'Prueba de traslacion anterior del astragalo respecto a la tibia para valorar la integridad del ligamento peroneoastragalino anterior.',
    typicalUse: 'Valoracion de la integridad ligamentosa lateral del tobillo tras esguince por inversion.',
  },
  'ankle-thompson': {
    name: 'Prueba de Thompson',
    description: 'Prueba de compresion de gemelo para valorar la respuesta de flexion plantar y descartar rotura del tendon de Aquiles.',
    typicalUse: 'Cribado inicial ante sospecha de rotura de Aquiles o lesion tendinosa importante.',
  },
  'shoulder-neer-impingement': {
    name: 'Signo de Neer',
    description: 'Elevacion pasiva anterior del hombro en rotacion interna para valorar provocacion de dolor subacromial.',
    typicalUse: 'Cribado de dolor subacromial o impingement en pacientes con dolor de hombro.',
  },
  'shoulder-hawkins-kennedy': {
    name: 'Prueba de Hawkins-Kennedy',
    description: 'Flexion pasiva anterior a 90 grados con rotacion interna forzada para valorar provocacion de dolor subacromial.',
    typicalUse: 'Valoracion de sindrome de dolor subacromial o impingement en pacientes con dolor de hombro.',
  },
  drop_arm_shoulder: {
    name: 'Prueba de brazo caido',
    description: 'Evalua la integridad del manguito rotador, especialmente del supraespinoso, durante el descenso eccentrico del brazo.',
    typicalUse: 'Sospecha de rotura relevante del manguito, debilidad marcada o incapacidad para controlar el descenso.',
  },
  apprehension_relocation_shoulder: {
    name: 'Prueba de aprension / recolocacion',
    description: 'Evalua aprension o inestabilidad anterior del hombro en abduccion y rotacion externa.',
    typicalUse: 'Antecedentes de luxacion, sensacion de inestabilidad o aprension con movimientos por encima de la cabeza.',
  },
  spurling_cervical: {
    name: 'Prueba de Spurling',
    description: 'Compresion cervical en extension y rotacion para reproducir dolor radicular.',
    typicalUse: 'Pacientes con dolor irradiado al brazo, parestesias o sospecha de radiculopatia cervical.',
  },
  ultt_a_cervical: {
    name: 'ULTT A / ULNTT del mediano',
    description: 'Prueba de tension neural para el nervio mediano con diferenciacion mediante movimientos cervicales.',
    typicalUse: 'Sintomas neuropaticos en miembro superior, hormigueo o parestesias compatibles con distribucion del mediano.',
  },
  cfrt_cervical: {
    name: 'Prueba de flexion-rotacion cervical (CFRT)',
    description: 'Evalua la contribucion de C1-C2 a la rotacion cervical en posicion de maxima flexion.',
    typicalUse: 'Cefaleas cervicogenicas, limitacion alta de rotacion cervical o asimetrias marcadas.',
  },
  valgus_stress_knee: {
    name: 'Prueba de estres en valgo (LCM)',
    description: 'Evalua la integridad del ligamento colateral medial a 0 y 30 grados de flexion.',
    typicalUse: 'Sospecha de lesion del LCM tras trauma en valgo o dolor medial de rodilla.',
  },
  varus_stress_knee: {
    name: 'Prueba de estres en varo (LCL)',
    description: 'Evalua la integridad del ligamento colateral lateral a 0 y 30 grados de flexion.',
    typicalUse: 'Dolor lateral de rodilla, trauma en varo o inestabilidad lateral.',
  },
  talar_tilt_ankle: {
    name: 'Prueba de inclinacion astragalina',
    description: 'Evalua la integridad ligamentosa lateral del tobillo mediante inclinacion en varo o valgo del astragalo.',
    typicalUse: 'Esguinces laterales de tobillo, sensacion de inestabilidad o dolor peroneal o medial.',
  },
  thoracic_pa_spring: {
    name: 'Prueba de spring PA toracico',
    description: 'Presion posteroanterior segmentaria en columna toracica para valorar movilidad y sensibilidad local.',
    typicalUse: 'Dolor toracico mecanico, rigidez dorsal o valoracion de segmentos hipo o hipermoviles.',
  },
  windlass_ankle: {
    name: 'Prueba de Windlass',
    description: 'Evalua la integridad de la fascia plantar mediante dorsiflexion de la primera metatarsofalangica manteniendo la posicion del tobillo.',
    typicalUse: 'Pacientes con dolor plantar de talon, sospecha de fascitis plantar o dolor del arco medial.',
  },
  phalen_wrist: {
    name: 'Prueba de Phalen',
    description: 'Prueba de flexion mantenida de muneca para valorar compresion del nervio mediano en tunel carpiano.',
    typicalUse: 'Pacientes con hormigueo, entumecimiento o dolor en distribucion del nervio mediano, con sospecha de tunel carpiano.',
  },
  thessaly_knee: {
    name: 'Prueba de Thessaly',
    description: 'Prueba de rotacion en carga a 5 y 20 grados de flexion para valorar compromiso meniscal y sensibilidad de estructuras internas de rodilla.',
    typicalUse: 'Pacientes con dolor de rodilla, sospecha de lesion meniscal o alteracion interna, especialmente en carga.',
  },
  cervical_distraction: {
    name: 'Prueba de distraccion cervical',
    description: 'Traccion manual aplicada a la columna cervical para valorar alivio de sintomas radiculares y compresion de raiz nerviosa.',
    typicalUse: 'Pacientes con radiculopatia cervical, dolor en brazo, parestesias o sospecha de compresion radicular.',
  },
  finkelstein_wrist: {
    name: 'Prueba de Finkelstein',
    description: 'Evalua tenosinovitis de De Quervain mediante desviacion cubital con el pulgar dentro del puno.',
    typicalUse: 'Pacientes con dolor radial de muneca y sospecha de tenosinovitis de De Quervain.',
  },
  ucl_stress_wrist: {
    name: 'Prueba de estres del ligamento colateral cubital (UCL)',
    description: 'Evalua la integridad del ligamento colateral cubital de la muneca mediante estres en desviacion radial.',
    typicalUse: 'Pacientes con dolor cubital de muneca y sospecha de esguince o inestabilidad del UCL.',
  },
  grip_strength_wrist: {
    name: 'Medicion de fuerza de agarre',
    description: 'Establece una linea base de fuerza de agarre e identifica deficits con dinamometro.',
    typicalUse: 'Valoracion de fuerza funcional de mano, linea base para seguimiento y comparacion entre lados.',
  },
  wrist_rom_wrist: {
    name: 'Valoracion del rango de movimiento de muneca',
    description: 'Cuantifica movimientos activos y pasivos de muneca: flexion, extension, desviacion radial y cubital.',
    typicalUse: 'Valoracion basal de movilidad, identificacion de limitaciones y provocacion de dolor durante el movimiento.',
  },
  'external-rotation-lag': {
    name: 'Signo de lag en rotacion externa',
    description: 'Evalua la capacidad para mantener la rotacion externa en una posicion elevada.',
  },
  "o'brien": {
    name: "Prueba de O'Brien",
    description: 'Flexion resistida de hombro con pronacion y supinacion para valorar sensibilidad labral.',
  },
  spurling: {
    name: 'Prueba de Spurling',
    description: 'Extension con carga axial para valorar provocacion radicular.',
  },
  'ultt-median': {
    name: 'Prueba de tension neural del miembro superior (nervio mediano)',
    description: 'Secuencia progresiva de tension neural para valorar sensibilidad del nervio mediano.',
  },
  'talar-tilt': {
    name: 'Prueba de inclinacion astragalina',
    description: 'Estres en inversion para valorar la respuesta ligamentosa lateral del tobillo.',
  },
};

const localizedFieldLabelsEs: Record<string, string> = {
  'Right leg angle achieved': 'Angulo alcanzado en pierna derecha',
  'Left leg angle achieved': 'Angulo alcanzado en pierna izquierda',
  'Radicular pain reproduced?': 'Se reproduce dolor radicular?',
  'Pain description': 'Descripcion del dolor',
  'Right cervical rotation': 'Rotacion cervical derecha',
  'Left cervical rotation': 'Rotacion cervical izquierda',
  'Pain or associated symptoms description': 'Descripcion del dolor o sintomas asociados',
  'Pain present during test?': 'Hay dolor durante la prueba?',
  'Weakness observed against resistance?': 'Se observa debilidad contra resistencia?',
  'Side tested (right/left/bilateral)': 'Lado evaluado (derecho/izquierdo/bilateral)',
  "Patient's typical symptoms reproduced?": 'Se reproducen los sintomas habituales del paciente?',
  'Symptom description': 'Descripcion de los sintomas',
  'Response to cervical release (structural/neural differentiation)': 'Respuesta a la liberacion cervical (diferenciacion estructural/neural)',
  'Pain with PA pressure in prone with feet on floor': 'Dolor con presion PA en prono con los pies apoyados',
  'Pain with feet elevated and extensor activation': 'Dolor con pies elevados y activacion extensora',
  'Pain change between both positions': 'Cambio de dolor entre ambas posiciones',
  'Side tested': 'Lado evaluado',
  'Knee height relative to contralateral side': 'Altura de la rodilla respecto al lado contralateral',
  'Pain reproduced': 'Dolor reproducido',
  'Region of pain': 'Region del dolor',
  'Anterior hip/groin pain reproduced': 'Se reproduce dolor anterior de cadera/ingle?',
  'Stance side': 'Lado en apoyo',
  'Contralateral pelvic drop observed': 'Se observa descenso pelvico contralateral?',
  'Compensations observed': 'Compensaciones observadas',
  'Anterior translation (tested vs contralateral side)': 'Traslacion anterior respecto al lado contralateral',
  'End-feel quality': 'Calidad del tope final',
  'Symptom response': 'Respuesta sintomatica',
  'Mechanical click/clunk reproduced': 'Se reproduce clic o clunk mecanico?',
  'Pain reproduced during maneuver': 'Se reproduce dolor durante la maniobra?',
  'Anterior knee pain reproduced': 'Se reproduce dolor anterior de rodilla?',
  'Pain location': 'Localizacion del dolor',
  'Crepitus noted during test': 'Se aprecia crepitacion durante la prueba?',
  'Anterior translation compared to contralateral side': 'Traslacion anterior comparada con el lado contralateral',
  'Comparison to contralateral side': 'Comparacion con el lado contralateral',
  'Active plantarflexion observed on calf squeeze': 'Se observa flexion plantar al comprimir el gemelo?',
  'Pain reproduced in forward elevation': 'Se reproduce dolor en elevacion anterior?',
  'Pain intensity (0–10) at end range': 'Intensidad del dolor (0-10) al final del rango',
  'Pain reproduced with internal rotation': 'Se reproduce dolor con rotacion interna?',
  'Shoulder tested': 'Hombro evaluado',
  'Control of descent': 'Control del descenso',
  'Pain during descent?': 'Hay dolor durante el descenso?',
  'Apprehension or fear of dislocation?': 'Hay aprension o miedo a luxacion?',
  'Pain vs apprehension': 'Dolor frente a aprension',
  'Response to relocation maneuver': 'Respuesta a la maniobra de recolocacion',
  'Side of lateral flexion/rotation': 'Lado de flexion lateral/rotacion',
  'Pain/paresthesia distribution': 'Distribucion del dolor/parestesias',
  'Local neck pain only without radiation?': 'Solo dolor cervical local sin irradiacion?',
  'Upper limb tested': 'Miembro superior evaluado',
  'Response to contralateral/ipsilateral cervical lateral flexion': 'Respuesta a la flexion lateral cervical contralateral/ipsilateral',
  'Side compared (right vs left)': 'Lado comparado (derecha vs izquierda)',
  'Approximate right rotation': 'Rotacion derecha aproximada',
  'Approximate left rotation': 'Rotacion izquierda aproximada',
  "Patient's typical headache reproduced?": 'Se reproduce la cefalea habitual del paciente?',
  'Knee tested': 'Rodilla evaluada',
  'Medial pain during test?': 'Hay dolor medial durante la prueba?',
  'Laxity at 30° flexion': 'Laxitud a 30 grados de flexion',
  'Laxity in extension (0°)': 'Laxitud en extension (0 grados)',
  'Lateral pain during test?': 'Hay dolor lateral durante la prueba?',
  'Ankle tested': 'Tobillo evaluado',
  'Laxity in varus': 'Laxitud en varo',
  'Laxity in valgus (deltoid)': 'Laxitud en valgo (deltoideo)',
  'Pain location during test': 'Localizacion del dolor durante la prueba',
  'Segments evaluated': 'Segmentos evaluados',
  'Hypomobile and painful segments': 'Segmentos hipomoviles y dolorosos',
  'Hypermobile segments (if any)': 'Segmentos hipermoviles (si los hay)',
  'Plantar heel or arch pain reproduced?': 'Se reproduce dolor plantar de talon o arco?',
  'Pain intensity (0-10)': 'Intensidad del dolor (0-10)',
  'Time to symptom onset (seconds)': 'Tiempo hasta el inicio de sintomas (segundos)',
  'Symptom distribution': 'Distribucion de los sintomas',
  'Pain at 5° flexion during rotation?': 'Hay dolor a 5 grados de flexion durante la rotacion?',
  'Pain at 20° flexion during rotation?': 'Hay dolor a 20 grados de flexion durante la rotacion?',
  'Mechanical clicking or locking sensation?': 'Hay sensacion de clic o bloqueo mecanico?',
  'Sensation of giving way or instability?': 'Hay sensacion de fallo o inestabilidad?',
  'Radicular symptoms relieved with traction?': 'Se alivian los sintomas radiculares con traccion?',
  'Pain reduction (if applicable)': 'Reduccion del dolor (si aplica)',
  'Traction force applied': 'Fuerza de traccion aplicada',
  'Adverse response (dizziness, nausea)?': 'Respuesta adversa (mareo, nauseas)?',
  'Comparison to baseline symptoms': 'Comparacion con los sintomas basales',
  'Pain reproduced during test?': 'Se reproduce dolor durante la prueba?',
  'Additional notes': 'Notas adicionales',
  'Pain reproduced during stress?': 'Se reproduce dolor durante el estres?',
  'Laxity or instability detected?': 'Se detecta laxitud o inestabilidad?',
  'Right grip strength (kg)': 'Fuerza de agarre derecha (kg)',
  'Left grip strength (kg)': 'Fuerza de agarre izquierda (kg)',
  'Deficit percentage (if applicable)': 'Porcentaje de deficit (si aplica)',
  'Pain during grip testing?': 'Hay dolor durante la prueba de agarre?',
  'Right wrist flexion (°)': 'Flexion de muneca derecha (grados)',
  'Left wrist flexion (°)': 'Flexion de muneca izquierda (grados)',
  'Right wrist extension (°)': 'Extension de muneca derecha (grados)',
  'Left wrist extension (°)': 'Extension de muneca izquierda (grados)',
  'Right radial deviation (°)': 'Desviacion radial derecha (grados)',
  'Left radial deviation (°)': 'Desviacion radial izquierda (grados)',
  'Right ulnar deviation (°)': 'Desviacion cubital derecha (grados)',
  'Left ulnar deviation (°)': 'Desviacion cubital izquierda (grados)',
  'Pain during any movement?': 'Hay dolor durante algun movimiento?',
  'Pain location (if present)': 'Localizacion del dolor (si esta presente)',
  'Test notes': 'Notas de la prueba',
};

const localizedFieldPlaceholdersEs: Record<string, string> = {
  'Note if lumbar or radicular pain appears.': 'Anota si aparece dolor lumbar o radicular.',
  'Location, pain type, radiation, etc.': 'Localizacion, tipo de dolor, irradiacion, etc.',
  'Note if pain, stiffness, or dizziness appears.': 'Anota si aparece dolor, rigidez o mareo.',
  'Location, pain type, radiation, associated symptoms.': 'Localizacion, tipo de dolor, irradiacion y sintomas asociados.',
  'Location (anterolateral, lateral), intensity, type.': 'Localizacion (anterolateral, lateral), intensidad y tipo.',
  'Indicate if one side at a time or both.': 'Indica si se evalua un lado cada vez o ambos.',
  'Location, pain type, tingling, numbness, etc.': 'Localizacion, tipo de dolor, hormigueo, entumecimiento, etc.',
  'Note if symptoms change when releasing cervical flexion.': 'Anota si los sintomas cambian al liberar la flexion cervical.',
  'E.g.: pain decreases when elevating feet and activating extensor musculature.': 'Ej.: el dolor disminuye al elevar los pies y activar la musculatura extensora.',
  'E.g. similar, slightly higher, clearly higher…': 'Ej.: similar, ligeramente mas alta, claramente mas alta…',
  'E.g. anterior hip/groin, sacroiliac region, lateral hip…': 'Ej.: cadera anterior/ingle, region sacroiliaca, cadera lateral…',
  'E.g. sharp anterior hip pain, tightness only, no symptoms…': 'Ej.: dolor agudo anterior de cadera, sensacion de tension, sin sintomas…',
  'E.g. right stance, left stance…': 'Ej.: apoyo derecho, apoyo izquierdo…',
  'E.g. trunk lean over stance leg, increased lateral sway, none…': 'Ej.: inclinacion del tronco sobre el lado en apoyo, aumento de balanceo lateral, ninguna…',
  'Right or left': 'Derecha o izquierda',
  'E.g. symmetric, slightly increased, clearly increased…': 'Ej.: simetrica, ligeramente aumentada, claramente aumentada…',
  'E.g. firm, soft, absent…': 'Ej.: firme, blando, ausente…',
  'E.g. sense of giving way, no symptoms…': 'Ej.: sensacion de fallo, sin sintomas…',
  'E.g. joint line pain, locking sensation, no symptoms…': 'Ej.: dolor en la interlinea, sensacion de bloqueo, sin sintomas…',
  'E.g. retro-patellar, peri-patellar…': 'Ej.: retropatelar, peripatelar…',
  'E.g. sense of giving way, local discomfort, no symptoms…': 'Ej.: sensacion de fallo, molestia local, sin sintomas…',
  'E.g. similar plantarflexion, clearly reduced, absent…': 'Ej.: flexion plantar similar, claramente reducida, ausente…',
  'Right, left, or bilateral (performed separately)': 'Derecho, izquierdo o bilateral (realizado por separado)',
  'E.g. anterior shoulder, lateral deltoid region…': 'Ej.: hombro anterior, region deltoidea lateral…',
  'E.g. anterior shoulder, lateral arm…': 'Ej.: hombro anterior, brazo lateral…',
  'E.g. similar, less, more, only symptomatic side positive…': 'Ej.: similar, menor, mayor, solo positivo el lado sintomatico…',
  'Controlled, sudden loss, inability to hold, etc.': 'Controlado, perdida brusca, incapacidad para sostener, etc.',
  'Deltoid area, suprascapular, anterolateral, etc.': 'Zona deltoidea, supraescapular, anterolateral, etc.',
  'Describe if pain predominates, sensation of "coming out", or both.': 'Describe si predomina el dolor, la sensacion de que se sale o ambas.',
  'E.g.: apprehension decreases when applying posterior pressure.': 'Ej.: la aprension disminuye al aplicar presion posterior.',
  'Approximate dermatomes, arm or hand area, etc.': 'Dermatomas aproximados, zona del brazo o mano, etc.',
  'Tingling, numbness, burning pain, etc.': 'Hormigueo, entumecimiento, dolor urente, etc.',
  'E.g.: symptoms increase with contralateral flexion, decrease with ipsilateral.': 'Ej.: los sintomas aumentan con la flexion contralateral y disminuyen con la ipsilateral.',
  'E.g.: ~40° in maximum flexion.': 'Ej.: unos 40 grados en flexion maxima.',
  'E.g.: ~30° in maximum flexion.': 'Ej.: unos 30 grados en flexion maxima.',
  'Similar to healthy side, slightly increased, clearly increased.': 'Similar al lado sano, ligeramente aumentada, claramente aumentada.',
  'Useful to assess associated capsular/cruciate ligament involvement.': 'Util para valorar posible compromiso capsular o de ligamentos cruzados asociados.',
  'Compare with contralateral knee.': 'Comparar con la rodilla contralateral.',
  'Compare with healthy side: similar, slightly increased, very increased.': 'Comparar con el lado sano: similar, ligeramente aumentada, muy aumentada.',
  'Optional depending on clinical case.': 'Opcional segun el caso clinico.',
  'Lateral, medial, diffuse, etc.': 'Lateral, medial, difuso, etc.',
  'E.g.: T3–T8.': 'Ej.: T3-T8.',
  'E.g.: T5–T6 with reproducible local pain.': 'Ej.: T5-T6 con dolor local reproducible.',
  'Optional if increased laxity is detected.': 'Opcional si se detecta aumento de laxitud.',
  'Medial calcaneal tubercle, medial arch, along plantar fascia...': 'Tuberculo calcaneo medial, arco medial, a lo largo de la fascia plantar...',
  'Similar response, more painful, only symptomatic side positive...': 'Respuesta similar, mas dolorosa, solo positivo el lado sintomatico...',
  'E.g., symptoms appear after 30 seconds, immediately, after 60 seconds...': 'Ej.: sintomas tras 30 segundos, inmediatamente, tras 60 segundos...',
  'Thumb, index, middle, radial half of ring finger (median distribution)...': 'Pulgar, indice, medio y mitad radial del anular (distribucion del mediano)...',
  'Similar, more symptomatic, only one side positive...': 'Similar, mas sintomatico, solo un lado positivo...',
  'Joint line pain, locking, clicking, instability, no symptoms...': 'Dolor en interlinea, bloqueo, clic, inestabilidad, sin sintomas...',
  'Complete relief, partial relief, no change, worse...': 'Alivio completo, alivio parcial, sin cambios, peor...',
  'Light, moderate, or approximate weight (e.g., 5-10 kg)...': 'Ligera, moderada o peso aproximado (ej.: 5-10 kg)...',
  'Symptoms decrease, no change, symptoms increase...': 'Los sintomas disminuyen, no cambian o aumentan...',
  'Radial styloid, first dorsal compartment, etc.': 'Estiloides radial, primer compartimento dorsal, etc.',
  'Severity, quality of pain, comparison to contralateral side.': 'Severidad, calidad del dolor y comparacion con el lado contralateral.',
  'More lax than opposite, similar, etc.': 'Mas laxo que el lado opuesto, similar, etc.',
  'Ulnar side of wrist, TFCC region, etc.': 'Cara cubital de la muneca, region del TFCC, etc.',
  'End feel, quality of laxity, associated symptoms.': 'Tope final, calidad de la laxitud y sintomas asociados.',
  'Record best of 3 attempts. Compare to normative values for age/gender.': 'Registrar el mejor de 3 intentos. Comparar con valores normativos segun edad y sexo.',
  'E.g., 20% deficit on right compared to left.': 'Ej.: deficit del 20 por ciento a la derecha respecto a la izquierda.',
  'Fatigue, consistency across attempts, compensatory patterns.': 'Fatiga, consistencia entre intentos y patrones compensatorios.',
  'Normal: 0-80°': 'Normal: 0-80 grados',
  'Normal: 0-70°': 'Normal: 0-70 grados',
  'Normal: 0-20°': 'Normal: 0-20 grados',
  'Normal: 0-30°': 'Normal: 0-30 grados',
  'Which movements provoke pain, location of pain.': 'Que movimientos provocan dolor y donde se localiza.',
  'End feel, quality of movement, compensatory patterns, stiffness.': 'Tope final, calidad del movimiento, compensaciones y rigidez.',
};

export const regionLabelsEs: Record<MSKRegion, string> = {
  shoulder: 'Hombro',
  cervical: 'Cervical',
  lumbar: 'Lumbar',
  knee: 'Rodilla',
  ankle: 'Tobillo',
  hip: 'Cadera',
  thoracic: 'Toracica',
  wrist: 'Muneca/Mano',
};

const localizeFieldDefinitionForEs = (
  field: TestFieldDefinition
): TestFieldDefinition => {
  const localizedLabel = localizedFieldLabelsEs[field.label];
  const localizedNotesPlaceholder = field.notesPlaceholder
    ? localizedFieldPlaceholdersEs[field.notesPlaceholder]
    : undefined;

  const localizedField: TestFieldDefinition = {
    ...field,
    label: localizedLabel || field.label,
    notesPlaceholder: localizedNotesPlaceholder || field.notesPlaceholder,
  };

  return localizedField;
};

export const localizeMskTestForEs = <T extends PhysicalTest | MskTestDefinition>(
  test: T
): T => {
  const localizedCopy = localizedTestCopyEs[test.id];
  const localizedFields = 'fields' in test && Array.isArray(test.fields)
    ? test.fields.map(localizeFieldDefinitionForEs)
    : undefined;

  const localizedTest = {
    ...test,
    ...(localizedCopy?.name ? { name: localizedCopy.name } : {}),
    ...(localizedCopy?.description ? { description: localizedCopy.description } : {}),
    ...(localizedCopy?.typicalUse ? { typicalUse: localizedCopy.typicalUse } : {}),
    ...(localizedCopy?.normalTemplate ? { normalTemplate: localizedCopy.normalTemplate } : {}),
    ...(localizedCopy?.defaultNormalNotes ? { defaultNormalNotes: localizedCopy.defaultNormalNotes } : {}),
    ...(localizedFields ? { fields: localizedFields } : {}),
  };

  return localizedTest as T;
};
