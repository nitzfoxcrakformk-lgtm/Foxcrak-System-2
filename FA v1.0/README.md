# FOXCRAK SYSTEM APS — Liga 1 Perú, simulador y Owner

## Abrir
1. Descomprime el ZIP manteniendo todos los archivos en la misma carpeta.
2. Abre `index.html` con un navegador actualizado.
3. Entra en **SIMULADOR APS**. Para el panel Owner, pulsa **PANEL OWNER** e introduce el PIN local `1`.

## Navegación e interfaz
- La navegación principal y las antiguas «Más secciones» están fusionadas en una sola barra con acentos neón por categoría.
- Debajo de **RANKINGS** aparecen **APUESTAS**, **RANGOS** y **COMPRAR**. Los tres están deshabilitados y muestran `BLOQUEADO: VERSIÓN 1.1`; al pulsarlos suena un SFX de error y aparece un aviso.
- En **COMPETICIONES**, Liga 1 Perú está temporalmente fuera de esta sección. Los módulos **TORNEOS NACIONALES** y **TORNEOS INTERNACIONALES** están vacíos y bloqueados con el texto `BLOQUEADO: VERSIÓN 1.1`. El catálogo de clubes y el simulador principal continúan disponibles.
- El panel Owner se abre como overlay y está organizado en dos columnas: controles en vivo, editor de partido, equipos, horarios, clubes y torneos.
- El panel Owner incluye un selector horizontal de intensidad de 7 niveles. Cambia el ritmo de los goles pendientes y las probabilidades de incidencias futuras; los eventos ya ocurridos quedan congelados y no se modifica el marcador observado.
- Los marcadores y nombres se muestran grandes y en negrita; las tarjetas se adaptan a pantallas pequeñas.

## Jornada de simulación
- **40 partidos por ciclo**: 20 nacionales y 20 internacionales (8 CONMEBOL Libertadores simulada, 8 CONMEBOL Sudamericana simulada y 4 Interliga APS).
- Los encuentros nacionales se reparten por el catálogo sudamericano. Perú recibe cuatro cruces locales por jornada; los demás países tienen representación según el plan de la jornada.
- En cada jornada peruana aparece al menos un club destacado. Los emparejamientos cambian por ronda y se priorizan rivales que no se hayan enfrentado recientemente. Ningún club se repite dentro de los 40 partidos del mismo ciclo.
- El generador evita forzar clásicos concretos: Universitario–Alianza Lima y Melgar–Deportivo Garcilaso ya no tienen preferencia y se sortearán como cualquier otro cruce. Regatas Dū Fórnika conserva nivel 92 y rota: juega una vez, descansa dos rondas y alterna Liga 1 e Interliga cuando vuelve a aparecer; su encuentro abre la jornada de su turno. Universitario conserva nivel 84.
- Los partidos empiezan en franjas escalonadas cada cinco minutos. Cada partido dura 70 minutos reales: 30 de primera parte, 10 de descanso y 30 de segunda parte.
- Los relojes se actualizan cada segundo y los marcadores/datos cada 30 segundos. Los goles, tarjetas, penales y revisiones VAR se generan como eventos ficticios; el sonido se activa después de una interacción del usuario.
- Los partidos finalizados entran en el registro y alimentan las clasificaciones y tops.

## VAR y eventos ficticios
- Gol: revisión VAR 22%; si se revisa, anulación condicional 28%.
- Amarilla: revisión 12%; si se revisa, puede cambiar a roja con probabilidad condicional 30%.
- Roja: revisión 15%; si se revisa, puede cambiar a amarilla con probabilidad condicional 22%.
- Penal: aparición aproximada del 11%; revisión 28%; anulación condicional 18%; conversión del penal válido 76%.
- Los avisos incluyen equipo, minuto y marcador, con `GOOOOL`, `TARJETA AMARILLA`, `TARJETA ROJA` y el dictamen de VAR. Son sucesos simulados.

## Panel Owner
El overlay permite elegir un partido y cambiar el marcador sin terminarlo, añadir goles, penales y tarjetas, solicitar VAR, ejecutar simulación inmediata, finalizar encuentros, editar equipos y horarios, y añadir clubes/torneos. El registro de eventos explica cada cambio.

**Seguridad:** el PIN `1` es un bloqueo local de demostración, no un mecanismo seguro para publicar una administración en Internet.

## Liga 1 Perú APS
La vista de Liga 1 Perú se conserva en el paquete por compatibilidad con el estado anterior, pero su acceso está temporalmente deshabilitado desde **COMPETICIONES**. El catálogo de clubes y el simulador APS general siguen disponibles; no se elimina el módulo de datos para evitar perder temporadas locales ya guardadas.

## Progreso y almacenamiento
- Perfiles, imágenes, preferencias, experiencia, historial de partidos y progreso de Liga 1 se guardan en este navegador.
- Perfiles nuevos comienzan con **R/. 1.000 y D// 0**; los perfiles existentes conservan su progreso.
- R/. y D// siguen como saldos virtuales; los módulos **APUESTAS**, **RANGOS** y **COMPRAR** están bloqueados para V1.1.
- La versión de calendario se ha incrementado para regenerar los encuentros antiguos al abrir la nueva edición, conservando los perfiles y el historial de campeonatos.

## Ranking de clubes y diagnóstico
- **RANKING DE CLUBES** lee el catálogo completo e incorpora cada partido finalizado una sola vez, evitando duplicados por `id`. Permite ordenar por puntos, goles, victorias, diferencia y partidos jugados, y filtrar por país.
- El ranking incluye también clubes sin partidos jugados con estadísticas iniciales en cero, para que la tabla no quede en blanco mientras comienza la temporada.
- **Intensidad Owner** tiene 7 niveles: Tranquilo, Suave, Controlado, Equilibrado, Intenso, Muy intenso y Locura. Los cambios aplican a partidos no finalizados; los eventos ya observados se congelan para conservar el marcador.

## Archivos
- `index.html`: interfaz y páginas.
- `styles.css`: diseño neón, tarjetas y overlay Owner.
- `simulator.js`: generación de 40 partidos, relojes, eventos, VAR, intensidad, historial y ranking de clubes.
- `app.js`: perfiles y navegación.
- `clubs-data.js`: catálogo sudamericano.
- `peru-league.js`: simulador nacional peruano.
- `fixtures-data.js`: referencia externa separada del simulador APS.
- `community-config.js`, `Auth.html`, `cloud-auth.js`: componentes opcionales de comunidad.


## Actualización de interfaz y aleatoriedad

- Los botones usan una capa CSS común de geometría pixel-art, bordes angulares, sombras duras, estados hover/pulsado, foco de teclado y aspecto deshabilitado. Se conservan los nombres de clase, IDs y manejadores existentes.
- El ranking de clubes ahora ofrece 24 opciones de ordenación calculadas, incluidos diferencia de goles, empates, porcentaje de victorias, promedios, rendimiento local/visitante, goleadas, penales y tarjetas. Las cifras combinan el archivo histórico y los partidos en curso, sin duplicar por ID.
- Reiniciar, cerrar o volver a abrir la web NO genera una jornada nueva: los mismos 40 partidos, equipos, IDs, marcadores, eventos, pronósticos y controles Owner se restauran desde el almacenamiento local. La simulación pausa su reloj mientras la página está cerrada y retoma el mismo minuto al reabrirse. Una ronda nueva solo aparece cuando vence el ciclo de la simulación con la página activa o cuando el Owner ejecuta deliberadamente el comando de generar jornada. Los refrescos de 30 segundos solo actualizan la interfaz.

## Actualización adicional: intensidad visual por encuentro y panel Owner

- Cada tarjeta de partido muestra un cuadrado de intensidad junto al contador de tiempo restante. El color recorre siete niveles, de tonos fríos para intensidad baja a rojo para intensidad máxima.
- El Panel Owner permite aplicar el nivel a **un partido elegido**, **todos los partidos programados/en curso**, **solo nacionales** o **solo internacionales**. Los partidos finalizados no se alteran.
- El botón **ELEGIR ENCUENTRO** abre un segundo overlay con tarjetas seleccionables, filtros por categoría y búsqueda de club/país/competición; cada tarjeta muestra estado, marcador e intensidad vigente.
- El Panel Owner usa una retícula más simétrica y adapta sus controles a ordenador, tablet y móvil.
- El tamaño del marcador se aumentó ligeramente, con ajuste específico para pantallas pequeñas.
- Se mantienen el calendario y la persistencia existentes: estas mejoras no generan ni reinician partidos.
- La intensidad se aplica automáticamente al soltar el control deslizante; no hace falta pulsar un botón de confirmación. El estado informa si aumentó, se redujo o se actualizó y muestra las probabilidades nuevas.


## Actualización: selector de partidos e intensidad en directo

- El cuadrado de intensidad ahora es más grande y mantiene los colores de los siete niveles en tarjetas y detalles.
- El selector del Panel Owner es un overlay amplio con tres columnas independientes: **Finalizados**, **En juego** y **A continuación**. Cada tarjeta muestra con mayor tamaño los equipos, marcador, estado e intensidad; búsqueda y filtros por partidos nacionales/internacionales siguen disponibles.
- El control de intensidad ya no usa botón de confirmación. Al soltar el deslizador, se guarda y aplica el nivel seleccionado; muestra una notificación con “INTENSIDAD AUMENTADA”, “INTENSIDAD REDUCIDA” o “INTENSIDAD ACTUALIZADA”.
- Al abrir los detalles de cualquier encuentro se muestran los parámetros actuales del motor: posibilidad de ajuste temporal de goles, multiplicador de amarillas, probabilidad de roja, penal y conversión de penal. Durante un encuentro se refresca el panel para mostrar la intensidad nueva.
- Al cambiar la intensidad en un partido en curso, primero se congelan los eventos observados con el perfil anterior; las probabilidades y distribución de eventos futuros usan el nuevo perfil. Los partidos finalizados no admiten cambios de intensidad.
- La lista de estado se refresca con el ciclo visual para no reemplazar tarjetas mientras el usuario hace clic. Se conserva la jornada existente y no se sortean partidos al reiniciar.


## Actualización: cola variada, refresco sincronizado e intensidad suave

- El contador **DATOS EN 00:30** se ancla al calendario de la jornada y a los inicios de partido separados por franjas exactas de cinco minutos. Solo se corrige si el reloj deriva más de 1,2 s; al refrescar o redibujar manualmente la página no se reinicia la cuenta atrás.
- El generador mezcla las 40 tarjetas por competencia y país antes de asignar sus franjas, evitando que la cola aparezca agrupada en bloques nacionales/internacionales. La mezcla es reproducible durante una ronda y cambia en cada ronda.
- Se eliminó la preferencia fija por Universitario–Alianza Lima y Melgar–Deportivo Garcilaso. Los enfrentamientos nacionales priorizan clubes con menos apariciones recientes y penalizan las revanchas recientes.
- Regatas Dū Fórnika juega en una ronda y descansa dos rondas completas; al volver alterna la participación entre Liga 1 e Interliga. Cuando le toca Liga 1, se conserva su cruce especial con FC Cajamarca.
- Los encabezados de las competiciones nacionales muestran **AMISTOSO** junto al nombre de la liga.
- El deslizador de intensidad del Panel Owner ahora rellena la barra según el nivel, cambia su acento de color y suaviza las transiciones al mover el control.


## Corrección de ranking y marcador (última actualización)

- El **Ranking de clubes** consolida cada partido una sola vez desde el historial y añade provisionalmente los encuentros en juego. Los partidos programados que aún no han empezado no afectan a la tabla.
- Se reemplazaron las tarjetas de rankings reservados por indicadores funcionales de clubes en la tabla, partidos contabilizados, goles y líder actual.
- La tabla permite ordenar por puntos, goles a favor, victorias, empates, derrotas, diferencia de goles, porcentaje de victorias y partidos jugados.
- Los encuentros en curso llevan un indicador verde discreto para diferenciarlos; cada fila refleja PJ, G, E, P, GF, GC, DG, PTS y % de victorias.
- Los marcadores de las tarjetas aumentan ligeramente de tamaño y el cuadrado junto a **VER PARTIDO** muestra solo el color del nivel de intensidad, sin etiqueta visible ni tooltip.


### Ranking de clubes: actualización

- La tabla integra el historial guardado y los partidos en curso (provisionales), sin contar dos veces encuentros con el mismo ID.
- La cabecera del ranking presenta cuatro indicadores y la tabla incorpora 24 opciones de ordenación: puntos, goles, victorias, empates, derrotas, diferencia, porcentajes, promedios, vallas invictas, rendimiento local/visitante, goleadas, penales y tarjetas.
- El cuadrado a la izquierda de «VER PARTIDO» es un indicador de intensidad solamente por color; no tiene etiqueta visible. El score aumenta ligeramente.
