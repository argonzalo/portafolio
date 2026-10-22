# Backend del guía · T-A21

`POST /api/guide` es una ruta de servidor. La UI y el observador corresponden a T-A22/T-A27.

## Contrato HTTP para T-A27

Cuerpo JSON (máximo 24 KB):

```json
{
  "message": "¿Qué resuelve Vibo?",
  "chapterId": "vibo",
  "beatId": "razonamiento",
  "history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¿Qué te gustaría conocer?" }
  ]
}
```

`message`: 1–500 caracteres. `history` es opcional, solo admite user/assistant,
máximo 40 entradas de 1500 caracteres; se usan las últimas 12 (6 turnos).
No admite campos adicionales, instrucciones de sistema ni herramientas del cliente.
La ubicación desconocida se omite del contexto.

Éxito: `text/event-stream`, eventos `data: <JSON>\n\n`:

```json
{"type":"text","text":"Vibo transforma…"}
{"type":"action","action":{"type":"openProject","id":"vibo"}}
{"type":"done"}
```

Una falla posterior a iniciar el stream produce `type: error`, `code: unavailable`
y una acción `showContact`. Antes del stream: 400 cuerpo inválido, 403 origen ajeno,
415 formato, 429 límite, 503 apagado/configuración/Redis. Todos llevan JSON con
`code`, `message` y `action: {type: "showContact"}`. `Cache-Control: no-store`.
El cliente debe incluir cookies del mismo origen y validar de nuevo las acciones
contra su registro antes de ejecutarlas. Las cinco tools no ejecutan efectos en
el servidor. `highlight` rechaza todos los argumentos mientras no haya un registro
de objetivos; no se inventan IDs.

## Configuración y protección

Usa las variables server/secret ya declaradas en `astro.config.ts` y `.env.example`.
`GUIDE_ENABLED` debe ser true, con credenciales OpenAI/Upstash y un
`GUIDE_SESSION_SECRET` aleatorio de al menos 32 caracteres. Una cookie HttpOnly,
SameSite=Strict y Secure en HTTPS contiene un identificador con HMAC y vencimiento
de 24 horas. Renovar/eliminar la cookie no evita los límites de IP.

- Sesión: 12 llamadas en 24 horas; incremento atómico con TTL.
- IP: 30/h y 60/d, ventanas deslizantes Upstash. Solo se guarda su HMAC.
  La dirección proviene de `Astro.clientAddress`, no de headers del visitante.
- Presupuesto: reserva atómica por día UTC, incluyendo intentos fallidos,
  cancelados y cada fallback. Sin reembolsos para no subestimar fallas parciales.
  El estimador usa bytes UTF-8 + 2048 tokens de margen de protocolo/tools,
  250 tokens máximos de salida y tarifas de planificación conservadoras de
  USD 10/M entrada y USD 40/M salida. **No es facturación real ni una tarifa
  confirmada de los modelos**: T-A28 debe contrastar tarifas/uso y ajustar
  `estimateMicroUsd` antes del lanzamiento. Sigue siendo necesario el tope del proveedor.
- Kill switch: `GUIDE_ENABLED=false`; además, la clave Redis `guide:enabled`
  con booleano JSON `false` apaga las llamadas inmediatamente sin redeploy.
  Eliminar esa clave permite nuevamente las llamadas si la variable sigue activa.
- Redis no disponible: no se llama al modelo. No hay fallback sin límites.

Modelo primario y fallback salen de las variables existentes. Sin reintentos
automáticos del SDK. Cada intento tiene 12 segundos y respeta la cancelación del
cliente. Solo se intenta el fallback antes del primer texto o acción, evitando
respuestas duplicadas. OpenAI recibe `store: false`; no se registran conversaciones
ni credenciales en logs de aplicación.

El contexto usa `astro:content`: su almacén se genera en build desde las
colecciones MDX. Se selecciona la ficha actual y el beat del registro, junto con
el índice compacto, persona y FAQs. No se lee el filesystem en la función Vercel.
No hay un segundo corpus ni un script que pueda quedar desactualizado.

## Verificación

```sh
node --test src/server/guide/backend.test.mjs src/server/guide/redis.test.mjs
npm run check
```

La integración Redis se omite sin credenciales. Para ejecutarla, cargar un env
local con `node --env-file=<ruta> --test src/server/guide/redis.test.mjs`.
Usa prefijos UUID separados y elimina sus claves. Comprueba concurrencia del
presupuesto, 12 sesiones, ambas ventanas IP y kill switch. No llama a OpenAI.

Se agregan exclusivamente las dependencias de ADR-005 y `zod` directo porque el
endpoint lo importa; package/lock son la integración mínima de plataforma de T-A21.
Los evals de comportamiento del modelo y calibración pertenecen a T-A28.

### Evidencia 2026-10-22

- `npm run check` completo: lint, tipos, build y presupuestos aprobados.
  Build conserva avisos MDX `use astro:head-inject` y chunks grandes del sitio.
- 9 pruebas locales aprobadas; integración Redis omitida si no hay credenciales.
- Integración contra Upstash real aprobada: presupuesto concurrente, sesión,
  ventanas horaria/diaria y kill switch. Claves de prueba eliminadas.
- HTTP real en puerto aislado 3011: consulta autorizada «¿Qué resuelve Vibo?»
  con capítulo/beat produjo HTTP 200, deltas de texto y `done` desde OpenAI.
- Búsqueda de la credencial real y del nombre `OPEN_AI_API_KEY` en
  `dist/client`: cero coincidencias.
- Fallback verificado con proveedor simulado que falla antes del primer delta;
  no se provocaron fallas en OpenAI real ni se ejecutaron los evals de T-A28.

Referencias: [AI SDK streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text),
[OpenAI streaming](https://developers.openai.com/api/docs/guides/streaming-responses),
[Upstash límites](https://upstash.com/docs/redis/sdks/ratelimit-ts/methods).
