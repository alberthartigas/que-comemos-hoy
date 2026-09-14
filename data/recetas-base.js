// Catálogo con el que arranca la app. Cantidades pensadas para 1 adulto; la app las escala.
// Si agregas recetas aquí, sube VERSION_BASE para que aparezcan en celulares que ya usaban la app.

import { DESAYUNOS } from './desayunos.js';
import { COMIDAS } from './comidas.js';
import { CENAS } from './cenas.js';

export const VERSION_BASE = 1;

// Videos de TikTok por id de receta (verificados con el oEmbed de TikTok en septiembre de 2026).
// Si un video desaparece, la app también ofrece una búsqueda en TikTok con el nombre del platillo.
export const VIDEOS_TIKTOK = {
  'avena-platano': 'https://www.tiktok.com/@nut.karlaltamirano/video/7126207284258049285',
  'huevos-mexicana': 'https://www.tiktok.com/@mariahzyz2y/video/7517772089793842462',
  molletes: 'https://www.tiktok.com/@fernandoatiye/video/7371193710551354630',
  'yogur-granola': 'https://www.tiktok.com/@jajacocina/video/7229488232415628586',
  'hotcakes-avena': 'https://www.tiktok.com/@tarynutricion/video/7289168331255385350',
  'omelette-espinacas': 'https://www.tiktok.com/@belvidafit/video/6850298612816055558',
  'chilaquiles-horneados': 'https://www.tiktok.com/@healthytoyou/video/7357785079336144133',
  'tostada-aguacate-huevo': 'https://www.tiktok.com/@angelacooksmx/video/7231295894916779269',
  'licuado-avena': 'https://www.tiktok.com/@recetasqueseheredan/video/7121719492631088389',
  sincronizadas: 'https://www.tiktok.com/@missohlaura/video/7130687569842621702',
  enfrijoladas: 'https://www.tiktok.com/@muncher.tips/video/7219051287965469957',
  'avena-nocturna': 'https://www.tiktok.com/@tallerdsabor/video/7257295227621264646',
  'huevo-nopales': 'https://www.tiktok.com/@cocinandoconfaby/video/6895761088516869382',
  'burrito-huevo': 'https://www.tiktok.com/@amorentucocina/video/7342917562226855211',
  'pollo-plancha': 'https://www.tiktok.com/@chefrodrigofernandini/video/7224544792896752942',
  'tinga-pollo': 'https://www.tiktok.com/@beatrizcontreras31/video/7563838411254058271',
  'caldo-pollo': 'https://www.tiktok.com/@aventuraentucocina/video/7189787285976567046',
  'tacos-pescado': 'https://www.tiktok.com/@mexicanaenlacocina/video/7321514118039620870',
  picadillo: 'https://www.tiktok.com/@cocinaconjazmin/video/7227938254929153285',
  'fajitas-pollo': 'https://www.tiktok.com/@mphnutricion/video/7312254801276849414',
  'ensalada-atun': 'https://www.tiktok.com/@lov.kari/video/7350810416886336811',
  'pasta-atun': 'https://www.tiktok.com/@chefjuanangel/video/7462140518948965638',
  'arroz-pollo': 'https://www.tiktok.com/@luisatorres.co/video/7497283556562013495',
  'bistec-mexicana': 'https://www.tiktok.com/@fernandoatiye/video/7408050568834436357',
  'calabacitas-pollo': 'https://www.tiktok.com/@marya_guzman/video/7399782379952278814',
  'pescado-horno': 'https://www.tiktok.com/@marcy.408/video/7190827582198205738',
  lentejas: 'https://www.tiktok.com/@esmeraldaenlacocina/video/7496613652670205230',
  'pollo-limon-brocoli': 'https://www.tiktok.com/@recetasdeadela/video/7510244748507073798',
  'tortitas-atun': 'https://www.tiktok.com/@isa.guisa/video/7436910142521658679',
  'enchiladas-horneadas': 'https://www.tiktok.com/@itseliromero/video/7145233473756810539',
  'quesadillas-champinones': 'https://www.tiktok.com/@nutriologa_brendaba/video/7203512120833576198',
  'ensalada-cesar-pollo': 'https://www.tiktok.com/@geralbys/video/7246802162171268357',
  'tostadas-frijol': 'https://www.tiktok.com/@maribcooking/video/7291818663559040299',
  'wrap-pollo': 'https://www.tiktok.com/@danielacasasfranco/video/7439760080825863480',
  'sandwich-pavo': 'https://www.tiktok.com/@mphnutricion/video/7216515885035474181',
  'crema-calabacita': 'https://www.tiktok.com/@cocinarygozaroficial/video/7399817458250566918',
  'tacos-lechuga-pollo': 'https://www.tiktok.com/@nidiaromomx/video/7187149798896569605',
  'nopales-panela': 'https://www.tiktok.com/@andableau_home/video/7345677682346102021',
  'pizza-tortilla': 'https://www.tiktok.com/@alyssatessa/video/7464319890011458822',
  'sopa-verduras': 'https://www.tiktok.com/@_soyruth_/video/7520028092669234439',
  'rollitos-pavo': 'https://www.tiktok.com/@kiki.stgo/video/7468453917492383019',
};

const aIngrediente = ([nombre, cantidad, unidad, paso]) => ({ nombre, cantidad, unidad, ...(paso ? { paso } : {}) });

export const RECETAS_BASE = [...DESAYUNOS, ...COMIDAS, ...CENAS].map((receta) => ({
  ...receta,
  origen: 'base',
  activa: true,
  favorita: false,
  tiktok: VIDEOS_TIKTOK[receta.id] ?? '',
  ingredientes: receta.ingredientes.map(aIngrediente),
}));
