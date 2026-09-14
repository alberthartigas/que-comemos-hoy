// Ingredientes: [nombre, cantidad para 1 adulto, unidad, paso de redondeo opcional]

export const CENAS = [
  {
    id: 'quesadillas-champinones', nombre: 'Quesadillas de champiñones', emoji: '🍄',
    tipos: ['cena'], minutos: 15, etiquetas: ['Vegetariana'],
    ingredientes: [
      ['Tortilla de maíz', 3, 'pza', 1], ['Champiñones', 100, 'g'], ['Queso Oaxaca', 40, 'g'],
      ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'], ['Chile serrano', 0.25, 'pza'], ['Salsa verde', 2, 'cda'],
      ['Aceite', 1, 'cdita'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Saltea cebolla, ajo y chile picados con poco aceite durante 2 minutos.',
      'Agrega los champiñones rebanados y sal; cocina de 6 a 8 minutos, hasta que suelten su jugo y se sequen.',
      'Rellena las tortillas con champiñones y queso y dóralas en el comal hasta que el queso se derrita.',
      'Sirve con salsa.',
    ],
  },
  {
    id: 'ensalada-cesar-pollo', nombre: 'Ensalada César ligera con pollo', emoji: '🥗',
    tipos: ['cena', 'comida'], minutos: 20, etiquetas: ['Alta en proteína', 'Ligera'],
    tip: 'El aderezo con yogur tiene mucha menos grasa que el de botella.',
    ingredientes: [
      ['Pechuga de pollo', 120, 'g'], ['Lechuga', 0.3, 'pza'], ['Yogur natural', 40, 'g'],
      ['Queso parmesano rallado', 1, 'cda'], ['Limón', 0.5, 'pza'], ['Ajo', 0.5, 'diente'], ['Mostaza', 0.5, 'cdita'],
      ['Pan integral', 1, 'rebanada'], ['Aceite de oliva', 1, 'cdita'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Cocina el pollo sazonado con sal y pimienta en sartén, 5 minutos por lado, y córtalo en tiras.',
      'En el mismo sartén tuesta el pan en cubitos: esos son los crutones.',
      'Para el aderezo mezcla yogur, limón, ajo muy picado, mostaza, parmesano, aceite de oliva, sal y pimienta.',
      'Revuelve la lechuga con el aderezo y sirve con el pollo y los crutones.',
    ],
  },
  {
    id: 'tostadas-frijol', nombre: 'Tostadas de frijol con lechuga y queso', emoji: '🌮',
    tipos: ['cena'], minutos: 10, etiquetas: ['Vegetariana', 'Rica en fibra'],
    ingredientes: [
      ['Tostadas horneadas', 3, 'pza', 1], ['Frijoles refritos', 80, 'g'], ['Lechuga', 0.1, 'pza'],
      ['Jitomate', 0.5, 'pza'], ['Queso fresco', 30, 'g'], ['Crema', 1, 'cda'], ['Aguacate', 0.25, 'pza'],
      ['Salsa verde', 1, 'cda'],
    ],
    pasos: [
      'Calienta los frijoles.',
      'Pica la lechuga y el jitomate.',
      'Unta frijoles en las tostadas y agrega lechuga, jitomate, aguacate, queso desmoronado, crema y salsa.',
    ],
  },
  {
    id: 'wrap-pollo', nombre: 'Wrap integral de pollo y verduras', emoji: '🥙',
    tipos: ['cena'], minutos: 15, etiquetas: ['Alta en proteína'],
    tip: 'Si sobró pollo de la comida, úsalo aquí y queda en 5 minutos.',
    ingredientes: [
      ['Tortilla de harina integral', 2, 'pza', 1], ['Pechuga de pollo', 100, 'g'], ['Lechuga', 0.1, 'pza'],
      ['Jitomate', 0.5, 'pza'], ['Zanahoria', 0.25, 'pza'], ['Aguacate', 0.25, 'pza'], ['Yogur natural', 30, 'g'],
      ['Limón', 0.5, 'pza'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Cocina el pollo sazonado en tiras de 6 a 7 minutos.',
      'Mezcla el yogur con limón, sal y pimienta para el aderezo.',
      'Calienta las tortillas y rellénalas con lechuga, jitomate, zanahoria rallada, aguacate y pollo.',
      'Pon aderezo, enrolla bien apretado y corta a la mitad.',
    ],
  },
  {
    id: 'sandwich-pavo', nombre: 'Sándwich integral de pavo y aguacate', emoji: '🥪',
    tipos: ['cena'], minutos: 10, etiquetas: ['Sin estufa', 'Para niños'],
    ingredientes: [
      ['Pan integral', 2, 'rebanada'], ['Jamón de pavo', 3, 'rebanada'], ['Queso panela', 30, 'g'],
      ['Aguacate', 0.25, 'pza'], ['Jitomate', 0.25, 'pza'], ['Lechuga', 0.1, 'pza'], ['Mostaza', 1, 'cdita'],
    ],
    pasos: [
      'Tuesta el pan si te gusta crujiente.',
      'Unta aguacate en una rebanada y mostaza en la otra.',
      'Arma con pavo, panela, jitomate y lechuga.',
      'Corta en diagonal y sirve.',
    ],
  },
  {
    id: 'crema-calabacita', nombre: 'Crema de calabacita ligera', emoji: '🥣',
    tipos: ['cena'], minutos: 25, etiquetas: ['Vegetariana', 'Ligera'],
    tip: 'La papa la hace cremosa sin necesidad de crema.',
    ingredientes: [
      ['Calabacita', 1.5, 'pza'], ['Papa', 0.25, 'pza'], ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'],
      ['Leche', 0.5, 'taza'], ['Queso panela', 20, 'g'], ['Pan integral', 1, 'rebanada'], ['Aceite', 1, 'cdita'],
      ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Sofríe la cebolla y el ajo con poco aceite durante 2 minutos.',
      'Agrega la calabacita y la papa en trozos, 1 taza de agua por persona y sal; hierve 15 minutos.',
      'Licúa con la leche hasta que quede cremoso (con cuidado, está caliente).',
      'Sirve con cubitos de panela, pimienta y pan tostado.',
    ],
  },
  {
    id: 'tacos-lechuga-pollo', nombre: 'Tacos de lechuga con pollo', emoji: '🥬',
    tipos: ['cena'], minutos: 20, etiquetas: ['Alta en proteína', 'Ligera'],
    ingredientes: [
      ['Pechuga de pollo', 130, 'g'], ['Lechuga', 0.3, 'pza'], ['Zanahoria', 0.5, 'pza'], ['Pepino', 0.25, 'pza'],
      ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'], ['Salsa de soya baja en sodio', 1, 'cda'],
      ['Limón', 0.5, 'pza'], ['Aceite', 1, 'cdita'],
    ],
    pasos: [
      'Pica el pollo finito y dóralo con aceite, cebolla y ajo durante 7 minutos.',
      'Agrega la salsa de soya y el limón y cocina 1 minuto más.',
      'Lava y seca hojas grandes de lechuga.',
      'Rellena cada hoja con el pollo y zanahoria y pepino en tiras.',
    ],
  },
  {
    id: 'nopales-panela', nombre: 'Nopales asados con queso panela', emoji: '🧀',
    tipos: ['cena'], minutos: 15, etiquetas: ['Vegetariana', 'Ligera'],
    ingredientes: [
      ['Nopales', 2, 'pza', 1], ['Queso panela', 60, 'g'], ['Frijoles de la olla', 0.5, 'taza'],
      ['Jitomate', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'], ['Limón', 0.5, 'pza'], ['Tortilla de maíz', 2, 'pza', 1],
      ['Aceite', 1, 'cdita'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Barniza los nopales con muy poco aceite y sal.',
      'Ásalos en comal o sartén de 4 a 5 minutos por lado; asa también la panela en rebanadas, 1 a 2 minutos por lado.',
      'Calienta los frijoles y pica el jitomate y la cebolla con limón.',
      'Sirve los nopales con la panela encima, el pico de jitomate, frijoles y tortillas.',
    ],
  },
  {
    id: 'pizza-tortilla', nombre: 'Pizza de tortilla integral con verduras', emoji: '🍕',
    tipos: ['cena'], minutos: 15, etiquetas: ['Para niños'],
    ingredientes: [
      ['Tortilla de harina integral', 2, 'pza', 1], ['Puré de tomate', 3, 'cda'], ['Queso Oaxaca', 40, 'g'],
      ['Jamón de pavo', 1, 'rebanada'], ['Champiñones', 30, 'g'], ['Pimiento morrón', 0.25, 'pza'],
      ['Espinacas', 0.25, 'taza'], ['Orégano', 0, 'gusto'],
    ],
    pasos: [
      'Precalienta el horno a 200 °C (o usa un sartén con tapa).',
      'Unta el puré de tomate en las tortillas y espolvorea orégano.',
      'Agrega el queso, el jamón y las verduras en rebanadas finas.',
      'Hornea de 8 a 10 minutos (o en sartén tapado a fuego bajo) hasta que el queso se derrita y la orilla esté crujiente.',
    ],
  },
  {
    id: 'sopa-verduras', nombre: 'Sopa de verduras', emoji: '🥕',
    tipos: ['cena', 'comida'], minutos: 30, etiquetas: ['Vegetariana', 'Ligera'],
    ingredientes: [
      ['Zanahoria', 0.5, 'pza'], ['Calabacita', 0.5, 'pza'], ['Papa', 0.5, 'pza'], ['Granos de elote', 0.25, 'taza'],
      ['Jitomate', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'], ['Cilantro', 0.1, 'manojo'],
      ['Aceite', 1, 'cdita'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Licúa el jitomate con la cebolla y el ajo.',
      'Sofríe esa salsa con poco aceite durante 3 minutos.',
      'Agrega 1 ½ tazas de agua por persona, sal, la papa y la zanahoria en cubitos; a los 10 minutos añade calabacita y elote.',
      'Cocina 20 minutos en total y sirve con cilantro picado.',
    ],
  },
  {
    id: 'rollitos-pavo', nombre: 'Rollitos de pavo con panela y pepino', emoji: '🥒',
    tipos: ['cena'], minutos: 10, etiquetas: ['Sin estufa', 'Ligera'],
    ingredientes: [
      ['Jamón de pavo', 4, 'rebanada'], ['Queso panela', 40, 'g'], ['Pepino', 0.5, 'pza'], ['Zanahoria', 0.5, 'pza'],
      ['Aguacate', 0.25, 'pza'], ['Limón', 0.5, 'pza'], ['Chile en polvo', 0, 'gusto'],
    ],
    pasos: [
      'Corta la panela, el pepino y la zanahoria en bastones.',
      'Pon en cada rebanada de pavo un bastón de panela, uno de pepino y uno de zanahoria.',
      'Enrolla y sujeta con un palillo si hace falta.',
      'Sirve con aguacate, limón y chile en polvo al gusto.',
    ],
  },
];
