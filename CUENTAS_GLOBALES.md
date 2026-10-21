# FOXCRAK SYSTEM APS — cuentas globales con Google Apps Script

## Por qué no se usa Google Forms para contraseñas

Google Forms guarda respuestas. Si se añade una pregunta `Contraseña`, la respuesta original puede quedar guardada en la hoja de respuestas y estar accesible para quien tenga permisos sobre ella. **No añadas una pregunta de contraseña a Google Forms ni a Excel.**

Este proyecto incluye un formulario web integrado (`Auth.html`) servido por Apps Script. La contraseña se envía por HTTPS al servicio y el servidor almacena una sal y un hash PBKDF2-HMAC-SHA256, nunca la contraseña original. La hoja contiene información sensible de autenticación y debe permanecer privada.

## 1. Crea una hoja privada

1. Entra en [Google Sheets](https://sheets.google.com) con tu cuenta.
2. Crea una hoja vacía llamada `FOXCRAK_DB_PRIVADA`.
3. No la publiques y no compartas permisos de editor/lector con los usuarios de la web. La aplicación se ejecutará con los permisos del propietario.

## 2. Añade Apps Script y los dos archivos

1. En la hoja, abre **Extensiones → Apps Script**.
2. En el archivo `Code.gs`, reemplaza el contenido por todo el archivo `GOOGLE_APPS_SCRIPT.gs` de este paquete.
3. Pulsa `+` junto a Archivos → **HTML**; llama al archivo exactamente `Auth` (sin escribir `.html` en el cuadro) y pega el contenido de `Auth.html`.
4. Guarda el proyecto.
5. En el selector de funciones del editor, elige `foxcrakSetupDatabase` y pulsa **Ejecutar**. Acepta los permisos solicitados. La función guarda el ID de esta hoja en las propiedades privadas del script para que el servicio web siempre use la base correcta.
6. Vuelve a Google Sheets y comprueba que existan las pestañas `Accounts` y `Sessions`. No pongas la hoja en modo público.

### Qué guarda cada pestaña

- `Accounts`: serie, userId, nickname, club, registro público heredado, salt/hash de contraseña, estado, XP/nivel y fechas. Nunca la contraseña original.
- `Sessions`: hash de tokens de sesión, cuenta relacionada, caducidad y revocación. Los tokens originales no se guardan en la hoja.

No cambies los encabezados. En el formulario se aceptan las Normas de la Comunidad y el Aviso de Privacidad; antes se explica claramente que nickname, serie, club opcional, XP, nivel y estado aparecen en el directorio. Las cuentas nuevas se incluyen en el ranking. Las cuentas antiguas que habían elegido no aparecer siguen ocultas.

## 3. Publica la aplicación web

1. En Apps Script, pulsa **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Ejecutar como: **Yo** (el propietario).
4. Quién tiene acceso: **Cualquier persona** si tu cuenta permite acceso anónimo y deseas registro público. La disponibilidad de esta opción depende de la configuración de tu cuenta/organización.
5. Pulsa **Implementar**, completa la autorización y copia la URL que termina en `/exec`.

El backend necesita que el usuario sea anónimo al abrir el formulario público; sin ese permiso, un visitante podría no poder registrarse. Nunca compartas la hoja con permiso de edición para resolverlo.

## 4. Conecta la página web

1. Abre `community-config.js` en esta carpeta.
2. Sustituye la línea `endpointUrl: ''` por la URL de tu despliegue, por ejemplo:

   ```js
   window.FOXCRAK_COMMUNITY_CONFIG = Object.freeze({
     endpointUrl: 'https://script.google.com/macros/s/ID_DE_DESPLIEGUE/exec'
   });
   ```

3. Guarda el archivo. Vuelve a cargar la web mediante `http://localhost:8000` para probar. Para que todo el mundo use la misma dirección, publica juntos `index.html`, `styles.css`, `app.js` y `community-config.js` en tu alojamiento estático.
4. También puedes pegar la URL en **Configuración → Registro y ranking online → Guardar conexión**, pero así solo se guarda en ese navegador.

## 5. Prueba el flujo completo

1. Abre FOXCRAK y pulsa **CUENTA GLOBAL → REGÍSTRATE**.
2. Escribe un nickname único de 3–24 caracteres y una contraseña de mínimo 10 caracteres, con al menos una letra y un número.
3. Acepta las Normas de la Comunidad y el Aviso de Privacidad. Antes del botón, el formulario explica qué campos del perfil se mostrarán en el directorio; el club favorito es opcional.
4. Al registrarte, el servidor asigna una serie permanente como `#0000001`, crea un token de sesión y devuelve solo los campos necesarios al cliente.
5. En la pestaña `Accounts`, comprueba que `PasswordSalt` y `PasswordHash` tienen valores y que ninguna columna contiene la contraseña escrita. **Si vieras una contraseña original, detén la prueba y borra la fila; no debería pasar con este código.**
6. Cierra sesión, vuelve a entrar con el mismo nickname y contraseña, y después prueba desde otro dispositivo desde la URL pública de la web.
7. Entra a **Tops y rankings** o **Comunidad APS** y pulsa Actualizar. Los perfiles recién registrados aparecerán con su serie y XP; los perfiles heredados que habían elegido no aparecer se mantienen ocultos.
8. Cambia `Status` a `Suspendido` en la hoja. El siguiente intento de inicio de sesión debe ser rechazado. Para reactivar, cambia el campo a `Activo`. `En revisión` también bloquea el acceso.

## 6. Qué es online y qué no

- Nickname, serie, XP/nivel y estado público proceden de la base global.
- El estado `Activo` es aproximado: se basa en un latido reciente; de lo contrario, el directorio muestra `Desconectado`.
- XP/nivel se sincronizan. Rupras (R/.) y Doblones (D//) permanecen como datos virtuales locales y no se sincronizan con la base global.
- El registro global no sincroniza automáticamente el historial detallado, las preferencias visuales ni la biografía local.
- El servidor evita retrocesos y limita el aumento de XP por petición, pero un cliente modificado todavía podría intentar manipular un ranking casual; no lo uses como prueba competitiva ni como ranking antifraude o de premios. No conectes estas funciones a apuestas, depósitos o premios con valor.

## 7. Seguridad y límites

- Mantén la hoja privada; únicamente el script debe leer/escribir las tablas.
- No pidas la misma contraseña que el usuario utiliza en otros servicios. No compartas la contraseña, sal, hash ni tokens.
- Este prototipo no incluye recuperación por correo, verificación de edad, moderación automática ni recuperación si se pierde la contraseña.
- Apps Script tiene cuotas y límites. Para una comunidad grande o información sensible, usa un servicio de autenticación profesional y una base de datos con controles de abuso más completos.
- La implementación no puede realizarse desde este ZIP: el propietario debe autorizar Apps Script y publicar su URL desde su propia cuenta. Hasta entonces, las cuentas globales no están activas.

## Documentación oficial

- Apps Script como aplicación web: https://developers.google.com/apps-script/guides/web
- Comunicación entre HTML Service y servidor (`google.script.run`): https://developers.google.com/apps-script/guides/html/communication
- Servicio Utilities y funciones criptográficas: https://developers.google.com/apps-script/reference/utilities
