# Informe de verificación — FOXCRAK SYSTEM APS

## Revisión estática
- `node --check`: `app.js`, `simulator.js`, `peru-league.js`, `clubs-data.js` y `fixtures-data.js`: OK.
- HTML: comprobación de IDs duplicados y referencias a recursos locales: OK.
- CSS: llaves balanceadas: OK.
- ZIP: integridad comprobada después de empaquetar.

## Cambios comprobados en esta edición
- La tarjeta de **Liga 1 Perú APS** fue retirada de la portada de Competiciones. La acción antigua para abrirla muestra una nota de pausa temporal en lugar de abrir el módulo.
- El selector de países en el apartado de Competiciones mantiene todos los módulos nacionales bloqueados para V1.1.
- El ranking de clubes se rellena desde el catálogo, incluso antes de que haya partidos finalizados; incorpora resultados finales sin duplicarlos por ID. Se puede filtrar por país y ordenar por puntos, goles, victorias, diferencia y partidos jugados.
- El panel Owner incorpora el control de intensidad de siete niveles y una vista previa de incidencias.
- La intensidad se guarda en el estado local y se aplica a partidos futuros/no finalizados. En partidos en curso, los eventos que ya ocurrieron se congelan antes de aplicar el nuevo nivel para preservar el marcador observado.
- Los estilos del panel de intensidad son responsive y las dos tarjetas restantes de Competiciones se alinean en dos columnas en pantallas amplias y en una columna en móviles.

## Límites de verificación
Los marcadores, goles, tarjetas, penales, VAR, temporadas y resultados APS son simulados. Perfiles e historial son locales a este navegador. No se completó una inspección visual automatizada en un navegador real; la apariencia final debe revisarse abriendo `index.html`.


## Validación de la actualización pixel-art / aleatoriedad

- [x] La tabla de ranking calcula estadísticas desde el historial y partidos en curso.
- [x] El selector de ranking ofrece 24 categorías activas, incluyendo diferencia de goles, empates y porcentaje de victorias.
- [x] Clases CSS existentes e IDs de los botones conservados; capa visual común añadida al final de styles.css.
- [x] Token por carga del sitio: una nueva apertura avanza la revisión y reinicia la jornada aleatoria desde el momento de apertura; los refrescos de 30 segundos no cambian los cruces.
- [x] Verificación sintáctica de JavaScript y referencias de archivos locales después de los cambios.


## Persistencia al reiniciar
- Se eliminó la generación automática de una revisión nueva al cargar la página.
- Se guarda `lastActiveAt`; al cerrar y volver a abrir se desplazan las marcas temporales de la jornada por el tiempo de inactividad, manteniendo el mismo ciclo y el mismo minuto de partido.
- El botón de actualizar pantalla y el refresco periódico no generan partidos. La generación manual del Owner sigue siendo una acción explícita.
- Validación: sintaxis JavaScript con `node --check`; ZIP revisado después de actualizar `simulator.js`.

## Verificación adicional de intensidad / Panel Owner

- `node --check simulator.js`: correcto.
- `node --check app.js`: correcto.
- `node --check peru-league.js`: correcto.
- HTML: sin identificadores duplicados y todos los `script src` locales existen.
- CSS: análisis sintáctico de reglas sin errores.
- Selector secundario de partidos: overlay independiente, búsqueda textual, filtros Todos/Nacionales/Internacionales y selección de encuentro.
- Intensidad: ámbitos Partido elegido/Todos/Nacionales/Internacionales; los partidos finalizados se excluyen del cambio para proteger eventos ya registrados.
- Las pruebas visuales automatizadas con Chromium no terminaron en este entorno; se debe revisar visualmente en un navegador real antes de publicar.
- El control deslizante guarda y aplica el nuevo nivel al soltarlo; el mensaje de cambio reporta subida, reducción o actualización.


## Intensidad en directo / selector de tres columnas

- `node --check simulator.js`: correcto después de la actualización.
- `node --check app.js`: correcto.
- `node --check peru-league.js`: correcto.
- La interfaz del selector define columnas separadas para `final`, `live` y `upcoming`, cada una con su contador y lista de tarjetas.
- La intensidad se autoaplica con el evento `change` del deslizador; se eliminó el control de confirmación.
- La ficha de partido incluye las tasas asociadas al perfil y se refresca durante el ciclo visual y al aplicar un cambio Owner.
- Los cambios en vivo guardan los eventos pasados antes de modificar el nivel; la generación restante usa el perfil nuevo.
- Intento de prueba visual automatizada con Chromium bloqueado por la política del navegador de este entorno (`ERR_BLOCKED_BY_ADMINISTRATOR`); debe revisarse visualmente al abrir `index.html` localmente.


## Revisión adicional — cola y sincronización

- `simulator.js` pasa `node --check` después de los cambios.
- El refresco de 30 s deriva de `db.scheduleAnchor`, cuya agenda usa saltos de 5 minutos; el reloj manual de interfaz ya no reinicia el contador.
- La generación ya no contiene reglas forzadas de Universitario–Alianza Lima ni Melgar–Deportivo Garcilaso.
- Se conserva el cruce Regatas Dū Fórnika–FC Cajamarca durante su turno local y se deja descansar en las dos rondas siguientes antes de volver en otra competición.
- Las tarjetas nacionales muestran el rótulo AMISTOSO y el Panel Owner cambia suavemente el progreso visual del control de intensidad.
- La mezcla de calendario usa una semilla por jornada; reduce secuencias de la misma competición/país y mantiene únicos los IDs ya generados.

### Prueba de generador tras la revisión del sorteo

Se ejecutó una prueba aislada de las funciones reales del generador (`generateDailyMatches` y `mixFixtureOrder`) con el catálogo incluido:

- 8 rondas de prueba; cada una generó 40 encuentros únicos.
- Cada ronda contiene 20 partidos nacionales, 8 Libertadores, 8 Sudamericana y 4 Interliga.
- Cada ronda produjo 4 encuentros nacionales de Perú.
- No se reutilizó ningún club dentro de la misma ronda.
- Regatas apareció en Liga 1 en la ronda 0, descansó las rondas 1 y 2, y volvió en Interliga en la ronda 3. La jornada comienza con el partido de Regatas cuando le corresponde jugar.
- El emparejamiento Universitario–Alianza Lima y Melgar–Deportivo Garcilaso ya no está codificado como preferencia; cualquiera de ellos podría salir por azar normal.
- Los intervalos de inicio siguen siendo de 5 minutos, preservando el anclaje del reloj de datos.
- La mezcla de competiciones se basa en una semilla por ronda y prioriza el equilibrio entre tipos de torneo y la variedad de países.

Las comprobaciones anteriores son pruebas de lógica en Node y revisión estática; no equivalen a una inspección visual manual en un navegador.


## Verificación adicional: ranking de clubes e indicador de intensidad

- `teamStandings()` ahora agrega el archivo histórico y los encuentros actuales en curso/finalizados usando el ID como clave, evitando contarlos dos veces.
- Para encuentros en curso utiliza el marcador visible del minuto actual; los encuentros programados se excluyen hasta que arranquen.
- La página de Ranking de clubes muestra un resumen de clubes, partidos contabilizados, goles registrados y líder actual.
- La tabla incorpora el porcentaje de victorias y permite ordenar por puntos, goles, victorias, empates, derrotas, diferencia de goles, porcentaje de victorias y partidos jugados.
- La tarjeta de partido coloca un cuadrado de color inmediatamente junto a `VER PARTIDO`; es solo visual y no añade texto visible.
- Se revisaron sintaxis JS y estructura del HTML/CSS después de los cambios. Los datos en curso son provisionales hasta que el partido termina.


## Ranking reparado y pruebas de estadísticas

Se ejecutó un test unitario aislado contra las funciones reales `clubRankingRecords`, `teamStandings` y `renderClubRanking` del archivo `simulator.js`, simulando un partido histórico y uno en curso. Resultado esperado y observado: 3 clubes en tabla, 2 partidos contabilizados sin duplicados, 4 goles totales, y estadísticas para el equipo con ambas apariciones (2 PJ, 2 G, GF 3, GC 1, 6 PTS), marcando solo el partido vivo como provisional.

Se eliminaron las tarjetas visuales que etiquetaban categorías como “PENDIENTE” y se sustituyeron por métricas calculadas. Se amplió el ranking a 24 criterios de ordenación. La tarjeta de partido conserva el pequeño cuadrado de intensidad, solo por color y sin texto visible ni tooltip, junto a «VER PARTIDO»; el marcador aumenta moderadamente.


## Resultado de comprobaciones finales de esta entrega

- 287 identificadores HTML, sin duplicados.
- Todos los 7 recursos locales enlazados desde HTML existen en el paquete.
- El selector `clubRankingMetric` contiene 24 opciones.
- El test unitario de agregación de ranking pasó con un partido histórico y otro en curso: 3 clubes, 2 partidos, 4 goles; sin doble conteo del mismo ID.
- El marcador usa 42 px en escritorio y 34 px en pantallas pequeñas; el cuadrado de intensidad permanece como señal cromática junto a `VER PARTIDO`, sin texto visible ni tooltip.
