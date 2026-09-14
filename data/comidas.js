// Ingredientes: [nombre, cantidad para 1 adulto, unidad, paso de redondeo opcional]

export const COMIDAS = [
  {
    id: 'pollo-plancha', nombre: 'Pechuga a la plancha con arroz y ensalada', emoji: '🍗',
    tipos: ['comida'], minutos: 25, etiquetas: ['Alta en proteína'],
    ingredientes: [
      ['Pechuga de pollo', 150, 'g'], ['Arroz', 0.25, 'taza'], ['Lechuga', 0.2, 'pza'], ['Jitomate', 0.5, 'pza'],
      ['Pepino', 0.5, 'pza'], ['Limón', 0.5, 'pza'], ['Aceite de oliva', 1, 'cda'], ['Ajo en polvo', 0, 'gusto'],
      ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Enjuaga el arroz y cuécelo con el doble de agua y sal, tapado a fuego bajo 18 minutos.',
      'Sazona las pechugas con sal, pimienta, ajo en polvo y limón.',
      'Cocínalas en sartén caliente con poco aceite de 4 a 5 minutos por lado, hasta que no estén rosadas por dentro.',
      'Mezcla lechuga, jitomate y pepino con limón y aceite de oliva, y sirve todo junto.',
    ],
  },
  {
    id: 'tinga-pollo', nombre: 'Tostadas de tinga de pollo', emoji: '🍅',
    tipos: ['comida', 'cena'], minutos: 30, etiquetas: ['Alta en proteína'],
    tip: 'Con pollo rostizado (sin piel) ya deshebrado queda en 15 minutos.',
    ingredientes: [
      ['Pechuga de pollo', 120, 'g'], ['Jitomate', 1, 'pza'], ['Cebolla', 0.5, 'pza'],
      ['Chile chipotle adobado', 0.5, 'pza'], ['Ajo', 1, 'diente'], ['Tostadas horneadas', 3, 'pza', 1],
      ['Frijoles refritos', 50, 'g'], ['Lechuga', 0.1, 'pza'], ['Crema', 1, 'cda'], ['Queso fresco', 20, 'g'],
      ['Aceite', 1, 'cdita'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Cuece la pechuga 20 minutos en agua con sal y un trozo de cebolla; deja enfriar y deshébrala.',
      'Licúa el jitomate con el ajo y el chipotle.',
      'Acitrona la cebolla fileteada con poco aceite, agrega la salsa y el pollo y cocina 5 minutos.',
      'Unta frijoles en las tostadas y sirve la tinga con lechuga, crema y queso.',
    ],
  },
  {
    id: 'caldo-pollo', nombre: 'Caldo de pollo con verduras', emoji: '🍲',
    tipos: ['comida'], minutos: 40, etiquetas: ['Ligera'],
    ingredientes: [
      ['Pollo en piezas (pierna o muslo sin piel)', 200, 'g'], ['Zanahoria', 0.5, 'pza'], ['Calabacita', 0.5, 'pza'],
      ['Papa', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'], ['Cilantro', 0.1, 'manojo'],
      ['Limón', 0.5, 'pza'], ['Tortilla de maíz', 2, 'pza', 1], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Pon el pollo en una olla con 2 tazas de agua por persona, la cebolla, el ajo y sal; hierve 20 minutos y retira la espuma.',
      'Agrega la papa y la zanahoria en trozos y cocina 10 minutos.',
      'Añade la calabacita y cocina 5 minutos más.',
      'Sirve con cilantro picado, limón y tortillas.',
    ],
  },
  {
    id: 'tacos-pescado', nombre: 'Tacos de pescado a la plancha', emoji: '🌮',
    tipos: ['comida'], minutos: 20, etiquetas: ['Alta en proteína', 'Ligera'],
    ingredientes: [
      ['Filete de pescado (tilapia)', 150, 'g'], ['Tortilla de maíz', 3, 'pza', 1], ['Col', 0.1, 'pza'],
      ['Aguacate', 0.25, 'pza'], ['Limón', 1, 'pza'], ['Crema', 1, 'cda'], ['Paprika', 0.25, 'cdita'],
      ['Ajo en polvo', 0, 'gusto'], ['Sal y pimienta', 0, 'gusto'], ['Aceite', 1, 'cdita'],
    ],
    pasos: [
      'Sazona el pescado con paprika, ajo en polvo, sal, pimienta y jugo de limón.',
      'Cocínalo en sartén con poco aceite 3 minutos por lado y desmenúzalo.',
      'Mezcla la crema con unas gotas de limón.',
      'Arma los tacos con col rallada, pescado, aguacate y la crema de limón.',
    ],
  },
  {
    id: 'picadillo', nombre: 'Picadillo de res con verduras', emoji: '🥘',
    tipos: ['comida'], minutos: 30, etiquetas: ['Alta en proteína'],
    ingredientes: [
      ['Carne molida de res', 120, 'g'], ['Papa', 0.5, 'pza'], ['Zanahoria', 0.5, 'pza'],
      ['Chícharos congelados', 0.25, 'taza'], ['Jitomate', 1, 'pza'], ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'],
      ['Tortilla de maíz', 3, 'pza', 1], ['Aceite', 1, 'cdita'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Pica la papa y la zanahoria en cubitos pequeños.',
      'Dora la carne con cebolla y ajo en poco aceite durante 5 minutos.',
      'Licúa el jitomate y agrégalo con la papa, la zanahoria, los chícharos, sal y pimienta.',
      'Tapa y cocina a fuego medio 15 minutos, hasta que las verduras estén suaves. Sirve con tortillas.',
    ],
  },
  {
    id: 'fajitas-pollo', nombre: 'Fajitas de pollo con pimientos', emoji: '🫑',
    tipos: ['comida', 'cena'], minutos: 25, etiquetas: ['Alta en proteína'],
    ingredientes: [
      ['Pechuga de pollo', 150, 'g'], ['Pimiento morrón', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'],
      ['Tortilla de harina integral', 2, 'pza', 1], ['Aguacate', 0.25, 'pza'], ['Limón', 0.5, 'pza'],
      ['Comino molido', 0.25, 'cdita'], ['Ajo en polvo', 0, 'gusto'], ['Sal y pimienta', 0, 'gusto'],
      ['Aceite', 1, 'cdita'],
    ],
    pasos: [
      'Corta el pollo, el pimiento y la cebolla en tiras.',
      'Sazona el pollo con limón, comino, ajo en polvo, sal y pimienta.',
      'Cocina el pollo en sartén bien caliente con poco aceite 6 minutos; agrega pimiento y cebolla y saltea 4 minutos más.',
      'Sirve en tortillas calientes con aguacate.',
    ],
  },
  {
    id: 'ensalada-atun', nombre: 'Ensalada de atún con aguacate', emoji: '🐟',
    tipos: ['comida', 'cena'], minutos: 15, etiquetas: ['Alta en proteína', 'Sin estufa'],
    ingredientes: [
      ['Atún en agua', 0.5, 'lata', 1], ['Jitomate', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'], ['Pepino', 0.5, 'pza'],
      ['Aguacate', 0.5, 'pza'], ['Chile serrano', 0.25, 'pza'], ['Cilantro', 0.1, 'manojo'], ['Limón', 1, 'pza'],
      ['Tostadas horneadas', 2, 'pza', 1], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Escurre bien el atún.',
      'Pica el jitomate, la cebolla, el pepino, el chile y el cilantro.',
      'Mezcla todo con limón, sal y pimienta.',
      'Sirve sobre tostadas con rebanadas de aguacate.',
    ],
  },
  {
    id: 'pasta-atun', nombre: 'Espagueti integral con jitomate y atún', emoji: '🍝',
    tipos: ['comida'], minutos: 25, etiquetas: ['Rica en fibra', 'Para niños'],
    ingredientes: [
      ['Espagueti integral', 80, 'g'], ['Atún en agua', 0.5, 'lata', 1], ['Jitomate', 1, 'pza'],
      ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'], ['Espinacas', 0.5, 'taza'], ['Aceite de oliva', 1, 'cda'],
      ['Orégano', 0, 'gusto'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Cuece la pasta en agua hirviendo con sal de 8 a 10 minutos (o lo que diga el paquete) y escúrrela.',
      'Sofríe cebolla y ajo picados en aceite de oliva, agrega el jitomate picado y cocina 5 minutos.',
      'Añade el atún escurrido, las espinacas, orégano, sal y pimienta; cocina 2 minutos.',
      'Mezcla con la pasta y sirve.',
    ],
  },
  {
    id: 'arroz-pollo', nombre: 'Arroz con pollo y verduras en una olla', emoji: '🍚',
    tipos: ['comida'], minutos: 35, etiquetas: ['Para niños'],
    ingredientes: [
      ['Pechuga de pollo', 120, 'g'], ['Arroz', 0.33, 'taza'], ['Zanahoria', 0.5, 'pza'],
      ['Chícharos congelados', 0.25, 'taza'], ['Pimiento morrón', 0.25, 'pza'], ['Jitomate', 0.5, 'pza'],
      ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'], ['Aceite', 1, 'cdita'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Corta el pollo en cubos y dóralo con poco aceite y sal durante 5 minutos.',
      'Agrega cebolla, ajo y el arroz enjuagado; mueve 2 minutos.',
      'Licúa el jitomate con el doble de agua que de arroz y viértelo junto con la zanahoria en cubitos, los chícharos y el pimiento.',
      'Tapa y cocina a fuego bajo 20 minutos sin destapar; deja reposar 5 minutos y sirve.',
    ],
  },
  {
    id: 'bistec-mexicana', nombre: 'Bistec a la mexicana con frijoles', emoji: '🥩',
    tipos: ['comida'], minutos: 25, etiquetas: ['Alta en proteína'],
    ingredientes: [
      ['Bistec de res', 130, 'g'], ['Jitomate', 1, 'pza'], ['Cebolla', 0.25, 'pza'], ['Chile serrano', 0.5, 'pza'],
      ['Frijoles de la olla', 0.5, 'taza'], ['Tortilla de maíz', 3, 'pza', 1], ['Aceite', 1, 'cdita'],
      ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Corta el bistec en tiras y sazónalo con sal y pimienta.',
      'Dóralo en sartén caliente con poco aceite durante 4 minutos.',
      'Agrega cebolla, chile y jitomate picados y cocina 8 minutos a fuego medio.',
      'Sirve con frijoles calientes y tortillas.',
    ],
  },
  {
    id: 'calabacitas-pollo', nombre: 'Calabacitas a la mexicana con pollo', emoji: '🥒',
    tipos: ['comida'], minutos: 25, etiquetas: ['Alta en proteína', 'Ligera'],
    ingredientes: [
      ['Pechuga de pollo', 120, 'g'], ['Calabacita', 1, 'pza'], ['Granos de elote', 0.25, 'taza'],
      ['Jitomate', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'], ['Chile serrano', 0.25, 'pza'], ['Ajo', 1, 'diente'],
      ['Queso panela', 30, 'g'], ['Tortilla de maíz', 2, 'pza', 1], ['Aceite', 1, 'cdita'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Corta el pollo en cubitos y dóralo con poco aceite y sal.',
      'Agrega cebolla, ajo y chile picados y cocina 2 minutos.',
      'Añade la calabacita en cubos, el elote y el jitomate picado; tapa y cocina 10 minutos.',
      'Sirve con cubitos de panela y tortillas.',
    ],
  },
  {
    id: 'pescado-horno', nombre: 'Pescado al horno con verduras', emoji: '🐠',
    tipos: ['comida'], minutos: 25, etiquetas: ['Alta en proteína', 'Ligera'],
    ingredientes: [
      ['Filete de pescado (tilapia)', 150, 'g'], ['Calabacita', 0.5, 'pza'], ['Zanahoria', 0.5, 'pza'],
      ['Brócoli', 0.2, 'pza'], ['Limón', 0.5, 'pza'], ['Ajo', 1, 'diente'], ['Aceite de oliva', 1, 'cda'],
      ['Orégano', 0, 'gusto'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Precalienta el horno a 200 °C (también funciona en freidora de aire).',
      'Corta las verduras en trozos, mézclalas con aceite de oliva, sal y pimienta y hornéalas 10 minutos.',
      'Agrega el pescado sazonado con ajo picado, limón y orégano.',
      'Hornea de 12 a 15 minutos más, hasta que el pescado se deshaga fácil con un tenedor.',
    ],
  },
  {
    id: 'lentejas', nombre: 'Lentejas guisadas con verduras', emoji: '🍛',
    tipos: ['comida'], minutos: 35, etiquetas: ['Vegetariana', 'Rica en fibra'],
    tip: 'Las lentejas no necesitan remojo y son de las proteínas más baratas.',
    ingredientes: [
      ['Lentejas', 0.33, 'taza'], ['Zanahoria', 0.5, 'pza'], ['Papa', 0.5, 'pza'], ['Jitomate', 0.5, 'pza'],
      ['Cebolla', 0.25, 'pza'], ['Ajo', 1, 'diente'], ['Tortilla de maíz', 2, 'pza', 1], ['Aceite', 1, 'cdita'],
      ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Enjuaga las lentejas y cuécelas 15 minutos en 3 tazas de agua por cada taza de lentejas.',
      'Mientras, sofríe cebolla, ajo y jitomate picados con poco aceite.',
      'Agrega a las lentejas el sofrito, la zanahoria y la papa en cubitos, y sal.',
      'Cocina 15 minutos más, hasta que todo esté suave. Sirve con tortillas.',
    ],
  },
  {
    id: 'pollo-limon-brocoli', nombre: 'Pollo al limón con brócoli', emoji: '🥦',
    tipos: ['comida', 'cena'], minutos: 25, etiquetas: ['Alta en proteína', 'Ligera'],
    ingredientes: [
      ['Pechuga de pollo', 150, 'g'], ['Brócoli', 0.25, 'pza'], ['Limón', 1, 'pza'], ['Ajo', 1, 'diente'],
      ['Arroz', 0.25, 'taza'], ['Aceite de oliva', 1, 'cda'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Cuece el arroz: 1 parte de arroz por 2 de agua, 18 minutos tapado a fuego bajo.',
      'Corta el pollo en tiras y sazónalo con sal, pimienta, ajo picado y la ralladura y el jugo del limón.',
      'Dóralo en aceite de oliva de 6 a 7 minutos.',
      'Agrega el brócoli en arbolitos con 2 cucharadas de agua, tapa 4 minutos y sirve con el arroz.',
    ],
  },
  {
    id: 'tortitas-atun', nombre: 'Tortitas de atún con ensalada', emoji: '🧆',
    tipos: ['comida'], minutos: 25, etiquetas: ['Alta en proteína', 'Para niños'],
    ingredientes: [
      ['Atún en agua', 0.5, 'lata', 1], ['Huevo', 0.5, 'pza', 1], ['Pan molido', 2, 'cda'], ['Cebolla', 0.25, 'pza'],
      ['Cilantro', 0.1, 'manojo'], ['Lechuga', 0.2, 'pza'], ['Jitomate', 0.5, 'pza'], ['Pepino', 0.5, 'pza'],
      ['Limón', 0.5, 'pza'], ['Aceite', 1, 'cdita'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Escurre muy bien el atún y mézclalo con el huevo, el pan molido, cebolla y cilantro picados, sal y pimienta.',
      'Forma tortitas del tamaño de la palma de tu mano.',
      'Cocínalas en sartén con poco aceite de 3 a 4 minutos por lado (o al horno a 200 °C por 15 minutos).',
      'Sirve con ensalada de lechuga, jitomate y pepino con limón.',
    ],
  },
  {
    id: 'enchiladas-horneadas', nombre: 'Enchiladas verdes de pollo al horno', emoji: '🫔',
    tipos: ['comida'], minutos: 35, etiquetas: ['Alta en proteína'],
    ingredientes: [
      ['Pechuga de pollo', 100, 'g'], ['Tortilla de maíz', 3, 'pza', 1], ['Salsa verde', 0.5, 'taza'],
      ['Queso Oaxaca', 30, 'g'], ['Crema', 1, 'cda'], ['Cebolla', 0.25, 'pza'], ['Lechuga', 0.1, 'pza'],
      ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Cuece la pechuga en agua con sal 20 minutos y deshébrala (o usa pollo rostizado sin piel).',
      'Calienta las tortillas para que no se rompan, rellénalas de pollo y acomódalas enrolladas en un refractario.',
      'Báñalas con la salsa verde caliente y pon el queso encima.',
      'Hornea a 180 °C por 15 minutos y sirve con cebolla, lechuga y un poco de crema.',
    ],
  },
];
