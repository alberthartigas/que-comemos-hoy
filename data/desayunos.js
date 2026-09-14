// Ingredientes: [nombre, cantidad para 1 adulto, unidad, paso de redondeo opcional]

export const DESAYUNOS = [
  {
    id: 'avena-platano', nombre: 'Avena cocida con plátano y canela', emoji: '🍌',
    tipos: ['desayuno'], minutos: 10, etiquetas: ['Vegetariana', 'Rica en fibra'],
    tip: 'La fibra de la avena te mantiene con energía hasta la comida.',
    ingredientes: [
      ['Avena en hojuelas', 0.5, 'taza'], ['Leche', 1, 'taza'], ['Plátano', 0.5, 'pza'],
      ['Canela molida', 0.25, 'cdita'], ['Miel', 1, 'cdita'],
    ],
    pasos: [
      'Pon la leche y la avena en una olla a fuego medio.',
      'Mueve de 5 a 7 minutos, hasta que espese.',
      'Sirve con el plátano en rodajas, canela y un hilo de miel.',
    ],
  },
  {
    id: 'huevos-mexicana', nombre: 'Huevos a la mexicana', emoji: '🍳',
    tipos: ['desayuno'], minutos: 15, etiquetas: ['Alta en proteína'],
    ingredientes: [
      ['Huevo', 2, 'pza', 1], ['Jitomate', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'], ['Chile serrano', 0.5, 'pza'],
      ['Tortilla de maíz', 3, 'pza', 1], ['Aceite', 1, 'cdita'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Pica el jitomate, la cebolla y el chile.',
      'Sofríe la cebolla y el chile 2 minutos con el aceite; agrega el jitomate y cocina 2 minutos más.',
      'Añade los huevos batidos con sal y mueve hasta que cuajen.',
      'Sirve con tortillas calientes.',
    ],
  },
  {
    id: 'molletes', nombre: 'Molletes con pico de gallo', emoji: '🥖',
    tipos: ['desayuno', 'cena'], minutos: 15, etiquetas: ['Vegetariana', 'Para niños'],
    ingredientes: [
      ['Bolillo integral', 1, 'pza', 1], ['Frijoles refritos', 80, 'g'], ['Queso Oaxaca', 40, 'g'],
      ['Jitomate', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'], ['Cilantro', 0.1, 'manojo'], ['Limón', 0.5, 'pza'],
      ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Parte el bolillo a la mitad y quítale un poco de migajón.',
      'Unta los frijoles, pon el queso y hornea (o en comal tapado) de 8 a 10 minutos, hasta que gratine.',
      'Mientras, pica jitomate, cebolla y cilantro y mézclalos con limón y sal: ese es el pico de gallo.',
      'Sirve los molletes con el pico de gallo encima.',
    ],
  },
  {
    id: 'yogur-granola', nombre: 'Yogur con fruta y granola', emoji: '🍓',
    tipos: ['desayuno'], minutos: 5, etiquetas: ['Vegetariana', 'Sin estufa'],
    tip: 'Usa yogur natural sin azúcar: la fruta y la miel ya endulzan.',
    ingredientes: [
      ['Yogur natural', 180, 'g'], ['Fruta de temporada picada', 0.75, 'taza'], ['Granola', 3, 'cda'],
      ['Miel', 1, 'cdita'],
    ],
    pasos: [
      'Pon el yogur en un vaso o tazón.',
      'Agrega la fruta picada (fresa, papaya, mango o plátano).',
      'Termina con la granola y un hilo de miel justo antes de comer, para que siga crujiente.',
    ],
  },
  {
    id: 'hotcakes-avena', nombre: 'Hot cakes de avena y plátano', emoji: '🥞',
    tipos: ['desayuno'], minutos: 20, etiquetas: ['Vegetariana', 'Para niños'],
    tip: 'Sin harina ni azúcar: el plátano bien maduro los endulza.',
    ingredientes: [
      ['Avena en hojuelas', 0.5, 'taza'], ['Plátano', 1, 'pza'], ['Huevo', 1, 'pza', 1], ['Leche', 0.25, 'taza'],
      ['Canela molida', 0.25, 'cdita'], ['Polvo para hornear', 0.5, 'cdita'], ['Aceite', 0.5, 'cdita'],
    ],
    pasos: [
      'Licúa la avena, el plátano, el huevo, la leche, la canela y el polvo para hornear hasta tener una mezcla espesa.',
      'Calienta un sartén antiadherente a fuego medio-bajo con unas gotas de aceite.',
      'Vierte ¼ de taza de mezcla y cocina unos 2 minutos; voltea cuando salgan burbujas.',
      'Sirve con fruta o un poquito de miel.',
    ],
  },
  {
    id: 'omelette-espinacas', nombre: 'Omelette de espinacas y queso panela', emoji: '🥚',
    tipos: ['desayuno', 'cena'], minutos: 10, etiquetas: ['Alta en proteína', 'Vegetariana'],
    ingredientes: [
      ['Huevo', 2, 'pza', 1], ['Espinacas', 1, 'taza'], ['Queso panela', 40, 'g'], ['Jitomate', 0.25, 'pza'],
      ['Aceite', 1, 'cdita'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Bate los huevos con sal y pimienta.',
      'Saltea las espinacas 1 minuto en el sartén con el aceite.',
      'Vierte el huevo, tapa y cocina a fuego bajo unos 3 minutos.',
      'Agrega la panela en cubitos y el jitomate, dobla a la mitad y sirve.',
    ],
  },
  {
    id: 'chilaquiles-horneados', nombre: 'Chilaquiles verdes horneados', emoji: '🌶️',
    tipos: ['desayuno'], minutos: 25, etiquetas: ['Vegetariana'],
    tip: 'Los totopos horneados (o en freidora de aire) llevan mucho menos aceite que los fritos.',
    ingredientes: [
      ['Tortilla de maíz', 4, 'pza', 1], ['Salsa verde', 0.5, 'taza'], ['Huevo', 1, 'pza', 1],
      ['Queso fresco', 30, 'g'], ['Crema', 1, 'cda'], ['Cebolla', 0.25, 'pza'], ['Aceite', 1, 'cdita'],
    ],
    pasos: [
      'Corta las tortillas en triángulos, barnízalas con muy poco aceite y hornéalas a 200 °C de 10 a 12 minutos, hasta que estén crujientes.',
      'Calienta la salsa verde en un sartén.',
      'Agrega los totopos y mezcla solo 1 minuto para que no se aguaden.',
      'Sirve con cebolla, queso fresco, un poco de crema y un huevo estrellado o revuelto.',
    ],
  },
  {
    id: 'tostada-aguacate-huevo', nombre: 'Pan tostado con aguacate y huevo', emoji: '🥑',
    tipos: ['desayuno'], minutos: 10, etiquetas: ['Alta en proteína', 'Vegetariana'],
    ingredientes: [
      ['Pan integral', 2, 'rebanada'], ['Aguacate', 0.5, 'pza'], ['Huevo', 1, 'pza', 1], ['Limón', 0.5, 'pza'],
      ['Jitomate', 0.25, 'pza'], ['Sal y pimienta', 0, 'gusto'],
    ],
    pasos: [
      'Tuesta el pan.',
      'Machaca el aguacate con limón, sal y pimienta.',
      'Cocina el huevo estrellado, o cocido 7 minutos en agua hirviendo.',
      'Unta el aguacate en el pan y pon encima el huevo y rodajas de jitomate.',
    ],
  },
  {
    id: 'licuado-avena', nombre: 'Licuado de plátano, avena y crema de cacahuate', emoji: '🥤',
    tipos: ['desayuno'], minutos: 5, etiquetas: ['Vegetariana', 'Sin estufa', 'Para niños'],
    ingredientes: [
      ['Leche', 1, 'taza'], ['Plátano', 1, 'pza'], ['Avena en hojuelas', 0.25, 'taza'],
      ['Crema de cacahuate', 1, 'cda'], ['Canela molida', 0.25, 'cdita'],
    ],
    pasos: [
      'Pon todo en la licuadora.',
      'Licúa 1 minuto, hasta que quede cremoso.',
      'Sirve de inmediato; si lo quieres frío, agrega 2 o 3 hielos.',
    ],
  },
  {
    id: 'sincronizadas', nombre: 'Sincronizadas integrales de pavo', emoji: '🫓',
    tipos: ['desayuno', 'cena'], minutos: 10, etiquetas: ['Para niños'],
    ingredientes: [
      ['Tortilla de harina integral', 2, 'pza', 1], ['Jamón de pavo', 2, 'rebanada'], ['Queso Oaxaca', 30, 'g'],
      ['Aguacate', 0.25, 'pza'], ['Salsa verde', 2, 'cda'],
    ],
    pasos: [
      'Pon el jamón y el queso sobre una tortilla y tapa con la otra.',
      'Calienta en comal o sartén a fuego medio de 2 a 3 minutos por lado, hasta que el queso se derrita.',
      'Corta en triángulos y sirve con aguacate y salsa.',
    ],
  },
  {
    id: 'enfrijoladas', nombre: 'Enfrijoladas con queso fresco', emoji: '🫘',
    tipos: ['desayuno', 'cena'], minutos: 15, etiquetas: ['Vegetariana', 'Rica en fibra'],
    ingredientes: [
      ['Tortilla de maíz', 3, 'pza', 1], ['Frijoles de la olla', 1, 'taza'], ['Cebolla', 0.25, 'pza'],
      ['Queso fresco', 30, 'g'], ['Crema', 1, 'cda'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Licúa los frijoles con su caldo y un trozo de cebolla hasta tener una salsa espesa; caliéntala con sal.',
      'Calienta las tortillas en el comal.',
      'Pasa cada tortilla por la salsa de frijol y dóblala en cuatro o enróllala.',
      'Sirve con más salsa, queso fresco desmoronado, cebolla picada y un poco de crema.',
    ],
  },
  {
    id: 'avena-nocturna', nombre: 'Avena nocturna con yogur y fruta', emoji: '🫙',
    tipos: ['desayuno'], minutos: 5, etiquetas: ['Vegetariana', 'Sin estufa', 'Rica en fibra'],
    tip: 'Déjala lista la noche anterior y en la mañana solo agregas la fruta.',
    ingredientes: [
      ['Avena en hojuelas', 0.5, 'taza'], ['Yogur natural', 100, 'g'], ['Leche', 0.5, 'taza'],
      ['Semillas de chía', 1, 'cdita'], ['Fruta de temporada picada', 0.5, 'taza'], ['Miel', 1, 'cdita'],
    ],
    pasos: [
      'En un frasco mezcla la avena, el yogur, la leche, la chía y la miel.',
      'Tapa y refrigera toda la noche (mínimo 4 horas).',
      'En la mañana agrega la fruta picada y listo.',
    ],
  },
  {
    id: 'huevo-nopales', nombre: 'Huevo con nopales', emoji: '🌵',
    tipos: ['desayuno'], minutos: 15, etiquetas: ['Alta en proteína', 'Rica en fibra'],
    ingredientes: [
      ['Huevo', 2, 'pza', 1], ['Nopales', 1, 'pza', 1], ['Jitomate', 0.5, 'pza'], ['Cebolla', 0.25, 'pza'],
      ['Tortilla de maíz', 3, 'pza', 1], ['Aceite', 1, 'cdita'], ['Sal', 0, 'gusto'],
    ],
    pasos: [
      'Pica los nopales y cocínalos en un sartén con el aceite a fuego medio unos 8 minutos, hasta que se seque su baba.',
      'Agrega cebolla y jitomate picados y cocina 2 minutos.',
      'Incorpora los huevos batidos con sal y mueve hasta que cuajen.',
      'Sirve con tortillas.',
    ],
  },
  {
    id: 'burrito-huevo', nombre: 'Burrito de huevo con frijoles', emoji: '🌯',
    tipos: ['desayuno'], minutos: 15, etiquetas: ['Alta en proteína'],
    ingredientes: [
      ['Tortilla de harina integral', 1, 'pza', 1], ['Huevo', 2, 'pza', 1], ['Frijoles refritos', 50, 'g'],
      ['Queso panela', 30, 'g'], ['Aguacate', 0.25, 'pza'], ['Salsa verde', 2, 'cda'], ['Aceite', 1, 'cdita'],
    ],
    pasos: [
      'Revuelve los huevos con sal en un sartén con el aceite.',
      'Calienta la tortilla y úntale los frijoles.',
      'Agrega el huevo, la panela, el aguacate y la salsa.',
      'Enrolla doblando las orillas y dora 1 minuto por lado.',
    ],
  },
];
