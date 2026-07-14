# Gobernanza de IA

> Traducción del original en inglés (`AI-GOVERNANCE.md`); la versión en inglés es la autoritativa.

QCR Workbench puede usar modelos de IA de forma opcional. Bajo el encuadre del
NIST AI RMF, la ISO/IEC 42001 y el EU AI Act, esta aplicación es un
**implementador** («deployer») de modelos de propósito general de terceros, no
un proveedor: no incluye ningún modelo, no entrena nada, y el usuario
selecciona y aporta las credenciales de cada modelo que se usa.

## Principios (aplicados en el código, no solo como política)

1. **La IA nunca hace las cuentas.** Cada resultado cuantitativo —
   descomposición FAIR, pérdida esperada, estadísticas de Monte Carlo,
   economía de los tratamientos — se calcula de forma determinista en
   `src/lib/qcr/`. Los prompts de IA *incrustan* las cifras ya calculadas
   (`src/lib/qcr/aiFeatures.js`) e instruyen al modelo para que no invente ni
   recalcule números. Una caída de la IA no cambia nada del análisis.
2. **Humano en el circuito para todo lo que entra en el modelo.** Los supuestos
   de alcance sugeridos por la IA se presentan en espera en la interfaz y
   entran en el escenario solo cuando el usuario acepta cada uno
   individualmente. La narrativa de IA es un borrador etiquetado adjunto al
   informe; nunca modifica estimaciones, resultados ni el alcance del
   escenario.
3. **Transparencia y procedencia** (patrón del Art. 50 del EU AI Act). Cada
   salida de IA se muestra con un aviso explícito de divulgación de IA; el
   proveedor, el modelo y la marca de tiempo se estampan en la narrativa
   guardada, se muestran en la interfaz, se escriben en el registro de
   auditoría y se incluyen en el bloque de divulgación del informe descargado.
4. **Detección de obsolescencia.** La narrativa guarda un hash de los datos de
   entrada con los que se redactó; si el modelo o los supuestos cambian
   después, la interfaz marca la narrativa como obsoleta hasta que se redacte
   de nuevo (y las ediciones de las estimaciones FAIR la borran directamente).
5. **Privacidad por arquitectura.** Las llamadas de IA van directamente desde
   el navegador al proveedor elegido por el usuario con la clave del propio
   usuario — sin proxy, sin intermediarios, sin capa de registro. Las opciones
   totalmente locales (WebLLM sobre WebGPU, la IA integrada de Chrome, Ollama
   local) son de primera clase y mantienen todo el contenido en el
   dispositivo. Consulta `DATA-PRIVACY.md`.
6. **Auditabilidad.** Cada generación de IA escribe un `AuditEvent` (categoría
   `ai`) que nombra al proveedor, de modo que un revisor pueda reconstruir qué
   partes tuvieron asistencia de IA.

## Para qué se usa la IA

| Función | Datos enviados | Tratamiento de la salida |
|---|---|---|
| Borrador de narrativa ejecutiva | Texto de alcance del escenario + cifras calculadas | Se guarda con procedencia + hash de las entradas; se muestra con divulgación; se añade a la exportación del informe bajo un encabezado explícito de divulgación |
| Sugerencias de supuestos | Texto de alcance del escenario + supuestos existentes | En espera; cada sugerencia requiere la aceptación explícita del usuario |
| Sugerencias de tratamientos | Texto de alcance del escenario + cifras base calculadas + nombres de tratamientos existentes | En espera; aceptar una sugerencia la abre precargada en el formulario de tratamiento para que el analista la revise, la ajuste y la guarde explícitamente (con registro de auditoría); la economía del tratamiento se recalcula siempre de forma determinista a partir de lo guardado |

## Para qué **no** se usa la IA

- Estimar o modificar los cinco factores FAIR
- Ningún cálculo, simulación o comparación
- Nada automático ni programado — cada llamada de IA es un clic del usuario

## Riesgos residuales que el usuario acepta

- **Error del modelo**: las narrativas pueden caracterizar mal los resultados
  calculados; el aviso de divulgación lo advierte, y los números de las tablas
  del informe siguen siendo los autoritativos.
- **Exposición al proveedor**: usar un proveedor en la nube envía el texto del
  escenario a ese proveedor bajo el acuerdo propio del usuario con él. El
  contenido regulado debería usar las opciones en el dispositivo.
