# T-A44 — Ritmo y continuidad del recorrido

Pedido humano: reducir la velocidad percibida aproximadamente un 40–50 % y pulir las transiciones. Refuerzo explícito del pedido para la cancha de pádel.

Implementación local en `codex/ritmo-recorrido`, con base `b5fb2ff630dd74657bf6e5c681e6baca547ea85e`. Sin commit, push ni publicación desde esta sesión. La aprobación estética queda pendiente del humano.

## Cambios

- Escenas: 100 → 180svh por beat. A igualdad de desplazamiento, el avance baja 44,4 %. Vibo pasa a 200svh por beat: 50 % menos; el golpe y sus overlays usan el mismo progreso.
- Cancha: se evita cruzar el punto de mira durante el acercamiento. El arco cercano permanece del mismo lado del jugador, se amplían los movimientos de cámara y se eliminan encuadres intermedios que provocaban rebotes de la spline. El regreso desde el cenital termina en p=0,84 y sostiene el encuadre antes del relevo a Pirp.
- Banner: conserva su beat único, pero dispone de 540svh para cuatro interfaces. Antes las cuatro se sucedían en 100svh.
- Manifiesto: 210 → 378svh. Revelado secuencial más suave, pausa de lectura y salida sincronizada con el cursor de cámara e hilo. Se elimina el doble scrub independiente.
- Fundidos entre mundos con más solapamiento para evitar el valle oscuro intermedio. Naturalis → Banner conserva la separación necesaria por la sala que escribe profundidad. La paleta usa la misma curva del relevo.
- Títulos de Pirp y Naturalis: fundido antes y después del cambio de texto, reversible. Entradas de paneles de Pirp más amplias.
- Retrato: aparición y fragmentación con scroll más tranquilas; interacción de puntero conservada.
- Movimiento reducido: conserva las alturas previas de las escenas y texto estático del manifiesto. Cambiar la preferencia después de la salida también restaura su opacidad.

## Verificación

- `npm run check`: lint, typecheck, build y ocho combinaciones de presupuestos de assets pasan. El build conserva los avisos existentes de directivas MDX y el hint de variable sin uso de la página de proyecto.
- Suite smoke sobre Chrome instalado: 2/2 pasan. El Chromium empaquetado de Playwright no está instalado en este equipo; `smoke.config.ts` permite usar Chrome sin modificar la configuración CI.
- Se corrigió un bloqueo previo de lint en `ProjectsDialog.tsx`: el reinicio del detalle se hace al cerrar, en lugar de un setState síncrono dentro de un efecto. El smoke verifica abrir lista → detalle → cerrar → reabrir lista. La expectativa antigua de `/projects` se actualizó al flujo vigente: redirección al archivo y lista en modal.
- `review.mjs`: capturas por beat en 1440×900 y 390×844; avance y retroceso por los seis relevos; comprobación de paleta reversible y máximo dos escenas montadas. Inspección de high/medium/low y preferencia de movimiento reducido, incluida su activación después de ocultarse el manifiesto. Sin errores de página ni consola durante los controles.
- Ritmo verificado por geometría real del DOM contra `baseline.json`, tomado antes de editar. `review.json` registra alturas relativas, muestras de GPU, controles de opacidad, reversibilidad y calidad. Los contadores GPU son muestras periódicas orientativas; no representan un perfil exhaustivo por escena.
- Picos de giro de cámara de Vibo por 100px de scroll: acercamiento desktop 381,3° → 7,8°, mobile 308,6° → 4,1°; tramo cenital/regreso desktop 189,4° → 21,3°, mobile 143,9° → 22,9°. Son diferencias entre direcciones de mira muestreadas de la trayectoria, con paso p=0,0005; no mediciones de un gesto humano ni grados por segundo.
- Muestra local al final del recorrido de calidades, en nivel low: aproximadamente 60 fps desktop y 56 fps mobile emulado con CPU ×4. Es evidencia local, no sustituye la prueba en un teléfono físico.

## Capturas y reproducción

`desktop-overview.png` y `mobile-overview.png` agrupan las capturas; cada archivo individual identifica capítulo y progreso. Deep link reproducible: `/?chapter=<id>&progress=<p>&quality=medium`.

- Manifiesto: p=0,25 / 0,55 / 0,72.
- Vibo: p=0,10 / 0,39 / 0,69 / 0,84.
- Pirp y Naturalis: p=0,10 / 0,30 / 0,50 / 0,70 / 0,84.
- Banner: p=0,10 / 0,36 / 0,60 / 0,84.
- AGNT: p=0,17 / 0,51 / 0,82.
- `mobile-reduced-motion.png`: manifiesto estático.

La revisión usa el dev server de Astro en `http://127.0.0.1:3011`. Primero prepara los imports lazy de Vite y recarga para utilizar los hashes del optimizador actual. Para repetir: `node docs/plan/evidencias/T-A44/review.mjs`. `baseline.mjs` documenta la toma original; no ejecutarlo sobre el resultado final porque reemplazaría la referencia anterior.

Queda pendiente la evaluación subjetiva del nuevo ritmo por el humano y la revisión en teléfono físico/Safari. No se agregaron dependencias ni assets al producto.
