# ¿Qué comemos hoy? 🍽️

Web app para celular que sugiere **al azar** qué desayunar, comer y cenar. Calcula los ingredientes para tu familia (adultos y niños) e incluye una mini receta y un video de TikTok. Funciona 100 % en local, sin cuentas y sin instalar dependencias.

## En internet y como app de Android

- **Web publicada:** https://laspinchisalitas.tech/proyectos/appcomidas/ — funciona sin conexión después de la primera visita y se puede "Agregar a inicio".
- **APK para Android:** https://github.com/alberthartigas/que-comemos-hoy/releases/latest/download/que-comemos-hoy.apk — la compila GitHub Actions (`.github/workflows/apk.yml`) cada vez que cambia `android/`. Es un envoltorio TWA que abre la web a pantalla completa, así que los cambios de la web llegan solos sin reinstalar.
- **Subir cambios al VPS:** `./subir-al-vps.sh` (usa el host `pinchis` de `~/.ssh/config`; nginx sirve la carpeta con `snippets/appcomidas.conf`).
- **Llave de firma de la APK:** `android/keystore/` (no se sube a GitHub; lee su `LEEME.txt`).

## Arrancar en local

Necesitas Node.js 18 o más nuevo.

- En Mac: doble clic en **Iniciar app.command**.
- O en la terminal, dentro de esta carpeta:

```bash
npm start
```

La terminal muestra dos direcciones:

- `http://localhost:8080`: para esta computadora.
- `http://192.168.x.x:8080`: para el **celular conectado al mismo Wi-Fi**.

La primera vez, macOS puede preguntar si Node puede aceptar conexiones entrantes. Acepta, o el celular no podrá entrar.

**Instalarla como app:** en iPhone (Safari) toca Compartir → "Agregar a inicio". En Android (Chrome) toca ⋮ → "Agregar a la pantalla principal".

## Calendario de la semana y "Agregar a…"

La página principal es **Semana**: una tira de lunes a domingo con los emojis de las tres comidas de cada día; tocas un día y abajo aparecen su desayuno, comida y cena (con "otra opción" en cada una). Las flechas cambian de semana y "Ver los 7 días completos" despliega la lista entera. **Hoy** es la pantalla secundaria: la comida que toca ahora según la hora y el resto del día.

En cada comida del calendario hay dos botones: ⇄ **otra opción** (el sorteo propone otro platillo) y ➕ **agregar propia receta**: escribes el nombre del platillo y la app busca la receta con IA (ingredientes para 1 adulto y pasos) y un video de TikTok de referencia, mostrando "Buscando…", y la deja en ese día y comida. El botón **Lista de compras de hoy** (o "Compras del jueves 17", según el día elegido) abre una hoja que sube desde abajo con las compras solo de ese día, con palomitas compartidas con la pestaña Hoy/Mañana de Compras y un enlace a la semana completa.

Para que la búsqueda del video de TikTok funcione hace falta una clave de buscador (gratuita) en el servidor: `SERPER_API_KEY` (serper.dev, 2,500 búsquedas gratis) o `BRAVE_API_KEY` en `/etc/appcomidas/ia.env`, y `systemctl restart appcomidas-ia`. Sin clave, la receta se agrega igual y su botón TikTok abre la búsqueda del platillo. (DuckDuckGo, Brave sin clave y Bing bloquean o no responden desde el servidor, y el modelo con búsqueda de Groq excede el límite gratuito.)

**Quitar una comida de un día:** desliza su fila hacia la izquierda (con mouse aparece una × tenue al pasar encima). La fila no desaparece: queda como un espacio en blanco "Sin planear · toca para agregar" que al tocarlo abre una hoja para elegir una receta guardada (de ese tipo o todas, con buscador), sortear una o agregar la tuya. En Ajustes → "¿Qué comidas haces al día?" se apaga una comida para siempre (por ejemplo, si no desayunas): desaparece del calendario, de Hoy, de los avisos y del sorteo.

En **Recetas** (lista y detalle) cada receta tiene el botón 📅 **Agregar a…**: abre una hoja para elegir el día (lo que queda de esta semana y toda la próxima) y si va de desayuno, comida o cena. La receta queda en ese espacio del calendario aunque no sea de ese tipo (la elección manual se respeta) y, si ya había otra, la reemplaza.

## Cómo decide qué toca

| Horario (se cambia en Ajustes) | Sugiere |
|---|---|
| 05:00 – 11:59 | Desayuno |
| 12:00 – 17:59 | Comida |
| 18:00 – 22:59 | Cena |
| Fuera de horario | La siguiente (en la noche, el desayuno de mañana) |

Reglas del sorteo:

- Nunca repite un platillo en el mismo día.
- No repite platillos en la semana (lunes a domingo). Si ya salieron todas las recetas de un tipo, repite la que salió hace más tiempo y lo avisa.
- Entre una semana y otra favorece las recetas que llevan más tiempo sin salir. Las favoritas ❤️ tienen el doble de probabilidad.
- "Otra opción" cambia una comida sin romper las reglas. Las recetas pausadas no entran al sorteo.

## Favoritas y recetas parecidas

Toca el ❤️ de una receta (en la lista o en su detalle) para marcarla como favorita. Con eso:

- El sorteo le da el doble de probabilidad a las favoritas y hasta 1.5× a las recetas **del mismo estilo** (parecidas por ingredientes principales y etiquetas; la lógica está en `js/similares.js`).
- Cada receta muestra "Parecidas a esta", y el filtro ❤️ Favoritas muestra "Del mismo estilo que tus favoritas".

## Modo claro y oscuro

De fábrica la app se ve en modo claro. El botón redondo de arriba a la derecha cambia entre claro y oscuro; en Ajustes → Apariencia puedes elegir Claro, Oscuro o Automático (sigue al celular). La preferencia se guarda en el dispositivo. El logo de la barra superior es una máscara que toma el color del texto, así se ve bien en los dos modos; los íconos de la app son el símbolo en blanco sobre negro (`icons/`, generados desde el logo original).

## IA (Groq)

Dos funciones, ambas opcionales: la app las muestra solo si el servidor tiene IA.

- **Llenar una receta desde TikTok:** en "Nueva comida" pega el enlace del video y la IA escribe nombre, ingredientes (para 1 adulto) y pasos; tú revisas y guardas.
- **Variantes de una receta:** en el detalle de cualquier receta, "Dame 3 variantes" propone platillos distintos del mismo estilo, con todo y pasos, listos para agregar al catálogo.

Cómo funciona: la clave de Groq vive **solo en el servidor** (`/etc/appcomidas/ia.env`, legible únicamente por root; systemd se la pasa al servicio). El servicio Node (`ia/servidor.js`, unidad `appcomidas-ia`) escucha en 127.0.0.1:3070 fuera del web root, y nginx lo publica en `/proyectos/appcomidas/api/`. Protecciones: solo acepta peticiones con origen `https://laspinchisalitas.tech`, nginx limita a 10 por minuto por IP y el servicio a 20 por hora por IP y 400 por día. Modelos: `openai/gpt-oss-120b` con respaldo automático a `gpt-oss-20b` y `qwen3.8-27b` (se cambian con `GROQ_MODELS`). La lógica está en `ia/ia.js` y se prueba en local con `GROQ_API_KEY=... npm start`.

Para cambiar la clave: vuelve a correr en el VPS el comando que guarda `/etc/appcomidas/ia.env` y luego `systemctl restart appcomidas-ia`.

## Notificaciones push (avisos de comida)

En Ajustes → Avisos de comida se activa una notificación a la hora de cada comida con el platillo que toca ("🍲 Comida de hoy: Tinga de pollo"). Cada comida tiene su hora (de fábrica 07:30, 12:30 y 19:00) y se puede dejar vacía. Funciona en Android (con la APK o desde Chrome) y en iPhone con la app agregada a inicio (iOS 16.4 o más nuevo).

Cómo funciona: es Web Push estándar con llaves VAPID (sin Firebase ni cuentas). El celular se suscribe y sube al servidor sus horas, su zona horaria y los nombres de los platillos de los próximos 8 días; cada vez que cambia el plan se vuelve a subir. El servicio `appcomidas-ia` guarda las suscripciones en `/var/lib/appcomidas/suscripciones.json`, revisa cada minuto a quién le toca aviso y lo manda; las suscripciones vencidas se borran solas. Las llaves viven en `/etc/appcomidas/push.env` (las genera `subir-al-vps.sh` la primera vez; si se cambian, todos los celulares tienen que volver a activar los avisos). En la APK, la librería TWA entrega las notificaciones a la app (`DelegationService`) y pide el permiso de Android 13+.

## Actualizaciones de la APK

La app no está en Play Store, así que se actualiza sola de esta forma: el envoltorio Android abre la web con `?apk=N` (su `versionCode`, que es el número de corrida de GitHub Actions). La web consulta la última release de GitHub cada 6 horas (respaldo: `version.json` en el dominio, que escribe `subir-apk.sh`) y, si hay una más nueva, la pantalla Hoy muestra "Nueva versión de la app" con **Actualizar** (descarga la APK; al abrirla, Android la instala encima y conserva los datos porque la firma es la misma) o **Ahora no** (vuelve a preguntar en 24 h). En Ajustes se ve la versión instalada y se puede buscar a mano.

Para publicar una versión nueva basta con cambiar algo en `android/` y hacer push (o correr el flujo a mano en Actions): la release aparece en minutos y los celulares la ofrecen solos. El flujo también instala la APK en un emulador Android, la abre con y sin Chrome y guarda capturas y logcat en el artefacto `diagnostico-emulador`; así se detectó el fallo de las versiones 0.1.1–0.1.3.

## Porciones

Las cantidades de cada receta son para **1 adulto**. De fábrica, cada niño cuenta como el 60 % de un adulto; en Ajustes puedes elegir entre 40 % y 100 %, y hacer la porción de adulto ligera o abundante. Todo se redondea hacia arriba a cantidades que se pueden comprar (huevos enteros, ½ aguacate, gramos de 10 en 10). La lista de compras suma todas las comidas antes de redondear.

## Recetas incluidas

Trae 41 recetas mexicanas fáciles y saludables:

- 14 desayunos, 16 comidas y 11 cenas. Algunas sirven para dos momentos del día.
- Todas se hacen en 40 minutos o menos, con ingredientes de súper o mercado.
- Cada una tiene un video de TikTok (enlaces verificados en septiembre de 2026) y un botón para buscar más.

## Tus datos

Todo se guarda en el navegador de cada dispositivo (localStorage), así que cada celular tiene sus propias recetas y su propio plan. Para pasarlos de uno a otro usa **Ajustes → Descargar respaldo / Importar respaldo**. Si cambia la IP de tu computadora, el celular lo trata como otro sitio y no ve tus datos: importa tu respaldo.

## Estructura

```
index.html          Estructura y barra de pestañas
css/styles.css      Estilos (modo claro y oscuro)
js/app.js           Rutas, pintado y eventos
js/vistas/          Pantallas: hoy, semana, compras, recetas, receta, formulario, ajustes
js/planner.js       Sorteo y reglas de no repetición
js/horarios.js      Regla de horario
js/porciones.js     Porciones, redondeo y lista de compras
js/store.js         Guardado local, respaldo e importación
data/               Recetas base y videos de TikTok
server.js           Servidor local sin dependencias
tests/              Pruebas de la lógica (npm test)
```

```bash
npm test
```

## Ideas para después

- Publicarla con https (Netlify o GitHub Pages) para usarla fuera de casa e instalarla como app completa.
- Compartir recetas y plan entre los celulares de la familia.
- Llenar ingredientes y pasos pegando un enlace de TikTok.
- Alergias y lista de "no me gusta".
