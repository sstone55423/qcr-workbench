# Privacidad de datos

> Traducción del original en inglés (`DATA-PRIVACY.md`); la versión en inglés es la autoritativa.

QCR Workbench está diseñado para que **tus datos de riesgo no puedan salir de
tu dispositivo sin una acción tuya**. Este documento es el inventario completo
de dónde viven los datos y de cada ruta por la que pueden viajar.

## Dónde viven los datos

| Datos | Ubicación | Protección |
|---|---|---|
| Proyectos, escenarios, estimaciones, tratamientos, registro de auditoría | IndexedDB del navegador | AES-GCM-256, clave derivada de tu contraseña (PBKDF2-SHA-256, 250 000 iteraciones, sal aleatoria) |
| Ajustes de la app, incl. claves de API de IA | El mismo almacén cifrado (registro `AppSettings`) | El mismo cifrado; nunca en localStorage ni en texto plano |
| Registro de almacenes (nombres de espacios de trabajo, pistas opcionales) | localStorage | No es secreto por diseño; **no** contiene contraseñas ni datos de riesgo |
| Tema, preferencias de UI independientes del idioma, minutos de bloqueo automático | localStorage | No es secreto; se necesita antes de desbloquear la bóveda |
| Correo opcional de la pantalla de bloqueo | localStorage | Se escribe **solo** si activas «mostrar en la pantalla de bloqueo»; se borra al desactivarlo |

La clave de cifrado derivada existe solo en memoria mientras la bóveda está
desbloqueada. Bloquear la bóveda (manualmente o mediante el bloqueo automático)
la descarta. **Una contraseña olvidada es irrecuperable** — no hay
restablecimiento, ni correo de recuperación, ni proveedor que pueda ayudarte.
Exporta copias de seguridad.

## Todas las rutas de red, de forma exhaustiva

La app no hace **ninguna** petición por su cuenta. Todo lo siguiente lo inicia
el usuario:

1. **Llamadas a IA en la nube** (opcional): cuando pulsas una acción de IA, el
   prompt — nombres de escenarios, descripciones, supuestos y cifras ya
   calculadas — va **directamente desde tu navegador al proveedor que
   configuraste** (Anthropic, OpenAI, Google o Alibaba), autenticado con tu
   propia clave. No hay proxy. Usa IA en el dispositivo (WebLLM o la integrada
   de Chrome) u Ollama local para mantener incluso esto en tu máquina.
2. **Descarga del modelo en el dispositivo** (opcional, una sola vez): activar
   WebLLM descarga los pesos cuantizados del modelo desde su CDN público; el
   navegador los guarda en caché.
3. **Google Fonts**: las dos tipografías de la interfaz se cargan desde el CDN
   de Google.
4. **Nada más.** Sin telemetría, sin analítica, sin informes de errores, sin
   comprobaciones de actualización, sin API propia.

## Copias de seguridad y exportaciones

- **Copia cifrada** (recomendada): un archivo JSON cifrado con una contraseña
  que tú eliges (el mismo esquema PBKDF2 + AES-GCM). Se puede guardar en
  cualquier sitio con seguridad.
- **Copia sin cifrar** (opcional, con advertencia): JSON en texto plano de
  todo, incluidas las claves de API guardadas. Se ofrece solo como salvaguarda
  de último recurso frente a una contraseña olvidada. Trátala como un archivo
  de contraseñas.
- **Informe (.md), registro de auditoría (.txt/.doc)**: en texto plano por
  naturaleza — ese es el sentido de la exportación. Compártelos de forma
  deliberada.

## Tus responsabilidades

- Elige una contraseña fuerte; es toda la frontera de seguridad.
- Si tus escenarios contienen información regulada o clasificada, prefiere la
  IA en el dispositivo o ninguna IA, y gestiona las exportaciones en
  consecuencia.
- En máquinas compartidas, usa el bloqueo automático (Ajustes → Seguridad) y
  bloquea la bóveda al ausentarte.

Para los detalles de ingeniería de seguridad (CSP, parámetros criptográficos,
encuadre regulatorio), consulta `SECURITY.md`.
