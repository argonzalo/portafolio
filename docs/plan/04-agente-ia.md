# 04 — Agente de IA: el guía atento

> Dirección tentativa de la descripción: un guía que lee el comportamiento del visitante en su sesión, ofrece ayuda cuando está detenido o trabado, y no es invasivo. Este documento lo convierte en un diseño implementable. Los puntos marcados como **decisión** se cierran en `decisiones.md` (ADR-008).

## 1. Principios

1. **La detección no usa IA; la conversación sí.** Saber si alguien está detenido o trabado se resuelve con reglas en el navegador (gratis, instantáneo, privado). El modelo solo se llama cuando el visitante acepta la ayuda o escribe.
2. **Primero ofrecer, nunca imponer.** La intervención proactiva es una oferta de una línea, descartable con un toque o con `Esc`.
3. **El guía es parte del concepto.** Se manifiesta como la punta del hilo conductor (ver `00`, §4), no como un chatbot genérico pegado en una esquina.
4. **Hace, no solo dice.** Puede ejecutar acciones de una lista cerrada (llevar a un beat, resaltar un elemento, abrir un caso, mostrar contacto): así el visitante ve un agente trabajando.
5. **Costo acotado por diseño.** Límites por IP, por sesión y globales; tope de gasto en OpenAI; interruptor para apagarlo sin deploy.

## 2. Arquitectura

```text
Navegador                                              Servidor (Vercel Function)
┌───────────────────────────────┐                      ┌──────────────────────────────────┐
│ Observador (src/guide/)        │                      │ POST /api/guide                  │
│  señales JourneySignal         │                      │  1. GUIDE_ENABLED?               │
│  → motor de reglas             │                      │  2. Validar cuerpo (Zod)         │
│  → estado: explorando /        │                      │  3. Rate limit IP + sesión +     │
│    detenido / trabado / rápido │                      │     presupuesto global (Upstash) │
│  → oferta proactiva (sin LLM)  │  solo si acepta      │  4. Contexto: persona + proyecto │
│ Interfaz del guía              │  o escribe  ───────► │     actual + beat + historial    │
│  ← stream de texto + acciones  │ ◄─────────────────── │  5. streamText(OPEN_AI_MODEL)    │
│ Ejecutor de GuideAction        │                      │     con tools de la lista cerrada│
└───────────────────────────────┘                      └──────────────────────────────────┘
```

- La API key se lee **solo en el servidor** mediante `astro:env` (esquema `server`, `secret`). La variable se llama `OPEN_AI_API_KEY` (no el nombre estándar de OpenAI), así que se pasa explícitamente al crear el proveedor: `createOpenAI({ apiKey })`.
- El modelo sale de `OPEN_AI_MODEL` y hay un `OPEN_AI_MODEL_FALLBACK` por si el principal falla o tarda.
- Variables nuevas a agregar en `.env.example`: `OPEN_AI_MODEL_FALLBACK`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `GUIDE_ENABLED`, `GUIDE_DAILY_BUDGET_USD`, `GUIDE_SESSION_SECRET`.

## 3. Señales y estados (cliente)

| Señal | Origen |
| --- | --- |
| Capítulo y beat activos, tiempo de permanencia | Store de la experiencia |
| Velocidad y dirección del scroll; inversiones repetidas | ScrollTrigger |
| Inactividad (sin scroll, puntero ni teclado) | Listeners pasivos |
| Intentos de interacción sin éxito (toques repetidos en zonas no interactivas, arrastres cortos) | Escena / DOM |
| Dispositivo y nivel de calidad | `quality.ts` |

| Estado | Regla inicial (se calibra con datos) | Oferta proactiva (ejemplo) |
| --- | --- | --- |
| **Detenido** | > 12 s en el mismo beat sin input, tras haber interactuado antes en la sesión | "¿Te cuento cómo se detecta el tipo de golpe?" |
| **Trabado** | ≥ 3 inversiones de scroll en el mismo capítulo en < 20 s, o ≥ 3 intentos de interacción fallidos | "Podés arrastrar para recorrer el golpe cuadro a cuadro." |
| **Rápido** | Atraviesa ≥ 2 capítulos en < 8 s | "¿Buscás algo puntual? Te llevo directo." (abre el índice) |
| **Final** | Llega al contacto | "¿Querés que te resuma lo que viste o dejar un mensaje?" |

**Reglas de cortesía (obligatorias):**

- Nada en los primeros 10 s de la sesión.
- Máximo una oferta proactiva por capítulo y un enfriamiento de 60 s entre ofertas.
- Nunca mientras el visitante está interactuando, escribiendo o en una transición.
- Si descarta dos ofertas seguidas, el guía pasa a modo silencioso (solo responde si lo llaman).
- Opción "No mostrar más" persistida en `localStorage`.

**Las ofertas proactivas son textos escritos de antemano** (por beat, en `src/content/guide/`), no generados. Costo cero, latencia cero y control total del tono. El humano los aprueba (T-H08).

## 4. Conversación (servidor)

**Contexto que recibe el modelo:**

- Persona y reglas del guía (escritas por el humano): quién es, cómo habla, qué no hace.
- Ficha resumida del proyecto actual y del beat donde está el visitante (generada en build desde las content collections).
- Índice compacto de todos los proyectos (una línea por proyecto) para responder comparaciones o saltar a otro.
- FAQs del humano: disponibilidad, cómo trabaja, tipos de proyecto que toma, cómo contactar.
- Historial de la sesión, truncado a los últimos 6 turnos.

No hace falta RAG: el corpus completo entra cómodo en el contexto. Se reconsidera si el contenido crece mucho.

**Tools (acciones sobre la interfaz):** `goToChapter`, `goToBeat`, `highlight`, `openProject`, `showContact`. El servidor solo declara las herramientas; la acción se ejecuta en el cliente tras validar los argumentos contra el registro de escenas (ids inexistentes se descartan).

**Límites de cada respuesta:** máximo ~250 tokens de salida, entrada del visitante máximo 500 caracteres, respuesta en el idioma del visitante.

**Decisión pendiente (ADR-008):** identidad del guía. Opciones: (a) guía del portafolio que habla de Gonzalo en tercera persona (recomendada: transparente, no suplanta); (b) "asistente de Gonzalo" en primera persona del plural; (c) habla como Gonzalo (desaconsejado: puede prometer cosas en su nombre).

## 5. Límites de uso y protección

| Capa | Regla inicial | Implementación |
| --- | --- | --- |
| Interruptor global | `GUIDE_ENABLED=false` apaga el guía (la interfaz se oculta) | Variable de entorno |
| Por sesión | 12 mensajes al modelo por sesión | Token de sesión firmado (HMAC con `GUIDE_SESSION_SECRET`), contador en Redis |
| Por IP | 30 mensajes por hora, 60 por día | `@upstash/ratelimit` con ventana deslizante |
| Global | Tope diario en USD estimado por tokens; al llegar, el guía responde con textos fijos | Contador en Redis + `GUIDE_DAILY_BUDGET_USD` |
| Proveedor | Límite de gasto mensual configurado en el panel de OpenAI | Lo hace el humano (T-H02) |
| Borde | Regla de rate limit de Vercel Firewall sobre `/api/guide`; evaluar Vercel BotID contra bots | Configuración en Vercel |
| Contenido | Validación con Zod, longitud máxima, rechazo de payloads extraños | Endpoint |

Cuando se alcanza un límite, el guía no desaparece en silencio: responde con un mensaje amable y ofrece el contacto directo.

## 6. Seguridad y privacidad

- Prompt injection: el impacto está acotado porque las únicas acciones posibles son de navegación y están validadas; el prompt de sistema no contiene secretos.
- No se guardan datos personales. Los logs (opcionales, para mejorar el guía) guardan solo capítulo, beat, pregunta y respuesta truncadas, sin IP; retención corta.
- Moderación: evaluar la API de moderación de OpenAI sobre la entrada si aparecen abusos (no en el MVP).

## 7. Interfaz

- **Desktop:** la punta del hilo se acerca a una esquina libre de la escena y abre una burbuja compacta. Al aceptar, se expande en un panel lateral angosto con el stream de texto y botones de acción sugeridos.
- **Mobile:** sheet inferior de media altura, nunca tapa el CTA de contacto; se cierra con gesto hacia abajo.
- **Accesibilidad:** región `aria-live="polite"`, foco gestionado al abrir y cerrar, `Esc` cierra, todo operable por teclado.
- **Estados:** pensando (el hilo late), respondiendo (stream), acción en curso (el hilo se mueve hacia el destino), error o límite (mensaje y contacto).

## 8. Calidad y costos

- **Evals:** un script (`npm run guide:eval`) ejecuta 20–30 escenarios fijos (preguntas típicas, intentos de sacar al guía de su rol, preguntas sobre precios, pedidos de acciones inválidas) y verifica reglas: idioma, longitud, que no invente proyectos, que las acciones sean válidas.
- **Costo estimado:** con ~2.000 tokens de entrada y ~250 de salida por mensaje, el costo por conversación es bajo; el tope global protege ante picos. Recalcular con el precio real de `OPEN_AI_MODEL` antes del lanzamiento (T-A28).
- **Métricas:** ofertas mostradas, aceptadas y descartadas por estado; mensajes por sesión; acciones ejecutadas; límites alcanzados. Sirven para calibrar los umbrales de §3.

## 9. Fases de implementación

| Paso | Tarea | Depende de |
| --- | --- | --- |
| 1 | Endpoint con streaming, tools, límites y kill switch, probado con un cliente mínimo | Adaptador Vercel (T-A03), Upstash (T-H02) |
| 2 | Contexto generado en build desde las content collections | Content collections (T-A04) |
| 3 | Observador + motor de reglas + panel de debug que muestra el estado detectado | Store y señales (T-A05) |
| 4 | Interfaz integrada con el hilo conductor | Hilo (ADR-006), al menos una escena terminada |
| 5 | Evals, calibración de umbrales y estimación de costos | Pasos 1–4 |
