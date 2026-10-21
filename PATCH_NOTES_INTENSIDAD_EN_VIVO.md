# Actualización: intensidad en vivo

- Indicador de intensidad ampliado en tarjetas, selector Owner y detalle de partido.
- Selector Owner con tres columnas de estado: finalizados, en juego y a continuación.
- Intensidad automática al soltar el control; eliminado el botón de confirmación.
- Mensajes visibles de aumento/reducción, feedback en Owner y toast breve.
- El cambio en vivo captura antes los eventos previos con el perfil anterior; las probabilidades y eventos futuros usan el nuevo perfil.
- El detalle del partido presenta y refresca probabilidades del motor de simulación.
- No se toca la persistencia de jornadas ni los rankings pendientes.


## Actualización adicional: cola amistosa y reloj sincronizado

- La cola de 40 encuentros se mezcla antes de asignar los horarios; intenta evitar categorías repetidas una tras otra y equilibra la proporción de ligas y copas.
- Se eliminan los cruces forzados Universitario–Alianza Lima y Melgar–Deportivo Garcilaso.
- Los partidos de las ligas nacionales muestran el distintivo **AMISTOSO**.
- El contador de datos se alinea al ancla común del calendario y ya no se reinicia con un redibujado manual.
- La barra de intensidad del Owner anima su relleno y el color de acento al cambiar de nivel.
