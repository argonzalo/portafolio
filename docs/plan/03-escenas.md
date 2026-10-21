# 03 — Escenas

> Las fichas de este documento son **propuestas iniciales** del análisis previo obligatorio (qué transmite, qué estética tiene, qué debe generar, cómo se integra). El humano las valida o corrige en la tarea de moodboard de cada escena **antes** de que un agente empiece el greybox. La plantilla vacía está en [`plantillas/ficha-escena.md`](./plantillas/ficha-escena.md).

## 1. Niveles de inmersión

| Nivel | Proyectos | Qué recibe | Esfuerzo relativo |
| --- | --- | --- | --- |
| **Primera línea: escena inmersiva** | Vibo, Pirp, Naturalis, Banner 2.0 | Mundo propio, 5 beats, assets dedicados, interacción, transición del hilo propia | 1 (referencia) |
| **Satélites** | App Etiquetas, Web Landing | Viven dentro del mundo de Banner: 1–2 beats extra con el kit de dispositivos | 0,2 |
| **Segunda línea: viñeta** | Starbene, AGNT, Cielo y Mar | 2–3 beats, armados con el kit, un elemento distintivo propio | 0,25–0,35 |
| **Tercera línea: archivo** | Venta Duplex, Arcor demo, Forme, Agro IA Tesis, Banner Teams | Entrada en el archivo interactivo 2D; página de caso breve | 0,05 |

## 2. Kit de escena (se construye en F2, lo usan todas)

Construir esto una vez es lo que hace viable el volumen de escenas. Vive en `src/scenes/kit/`.

| Pieza | Qué hace | La usan |
| --- | --- | --- |
| **Dispositivos 3D** (`Phone`, `Laptop`, `Display`) | Modelos low-poly con pantalla texturizable (captura o video) y **capas de UI que se separan y flotan** en 3D (requisito de la sección 10 de la descripción) | Naturalis, Banner, satélites, Starbene, AGNT, Cielo y Mar |
| **HUD / overlays** | Etiquetas, marcadores, ángulos, métricas animadas, ancladas a puntos 3D y renderizadas en DOM | Vibo, Pirp, Banner, AGNT |
| **Grafo de nodos / agentes** | Nodos que se encienden, aristas que transportan pulsos, "decisiones" visibles; layout precalculado | Vibo (pipeline), Pirp (temas), Banner (colas), AGNT (traspasos) |
| **Líneas y trayectorias** | Líneas gruesas con shader de brillo y dibujado progresivo (mismo shader que el hilo) | Todas |
| **Campo de partículas instanciado** | Partículas GPU con presupuesto por nivel | Pirp, Banner, Cielo y Mar |
| **Contadores y gráficos** | Números que cuentan, barras y curvas animadas en DOM/SVG | Todas |
| **Rig de cámara por beats** | Interpola encuadres definidos por beat, con variante mobile | Todas |

## 3. Primera línea

### 3.1 Vibo — "Ver lo invisible del juego"

| Análisis previo | Propuesta |
| --- | --- |
| **Qué transmite** | Ciencia aplicada al deporte: un video común se convierte en conocimiento preciso sobre cómo juega una persona |
| **Estética** | Noche, cancha iluminada. Azul profundo (fondo), azul eléctrico (datos), dorado (momentos clave y resultado). Líneas finas de precisión, números tabulares, estética de laboratorio deportivo |
| **Qué debe generar** | Asombro y confianza: "esto es serio, esto es preciso" |
| **Integración con el proyecto** | Toma la paleta de Vibo (oscuros, azules, dorado); el HUD imita el lenguaje de un análisis de rendimiento profesional |

**Beats**

1. **Mundo** — el filamento dibuja las líneas de la cancha en la oscuridad; se encienden los reflectores.
2. **Problema** — un fragmento de video crudo (plano, sin datos) flota sobre la cancha: "Un partido grabado no dice cómo jugaste".
3. **Razonamiento** — un jugador ejecuta un golpe. Se marcan las articulaciones, aparecen el ángulo de muñeca frente a hombros, la zona de la cancha y la trayectoria de la pelota (que es el propio filamento). En paralelo, un grafo de agentes ejecuta el pipeline: detección → seguimiento → calibración de cancha (de píxeles a metros) → detección de golpes → clasificación. Cada nodo se enciende cuando "decide".
4. **Solución** — la cámara sube a vista cenital: mapa de calor de zonas, cobertura de cancha frente al compañero y los rivales, perfil ofensivo/defensivo.
5. **Resultado** — tarjeta de jugador con métricas (estilo, golpes más frecuentes, desgaste a lo largo del partido) en dorado; CTA al caso completo.

**Interacción:** en el beat 3, el visitante puede pausar el golpe y arrastrar para recorrerlo cuadro a cuadro; en desktop, hover sobre una articulación muestra su dato.

**Técnica**

- Cancha procedural (líneas y planos), sin modelo pesado.
- **Jugador a partir de datos reales:** secuencias de keypoints exportadas del pipeline de Vibo (por ejemplo 17 puntos × N cuadros) renderizadas como articulaciones instanciadas + huesos con el shader de líneas, opcionalmente con una silueta low-poly. Es auténtico (son datos del producto real) y mucho más barato que un personaje con skinning. Alternativa si no hay datos: personaje de Mixamo con animación de golpe y material estilizado.
- Trayectoria de la pelota con datos reales de seguimiento.
- Mapa de calor como shader sobre el plano de la cancha, con datos precalculados en build.

**Mobile:** encuadre vertical con la cancha en perspectiva más cerrada; overlays de a uno por tap; el grafo del pipeline pasa a ser una tira vertical.

**Insumos del humano (T-H07):** 2–3 secuencias de keypoints y trayectoria de pelota (smash, bandeja, drive) en JSON; un set de métricas reales de un jugador (anonimizado); confirmación de paleta y logo; permiso para mostrar datos.

### 3.2 Pirp — "Todo pasa rápido, y aun así se entiende"

| Análisis previo | Propuesta |
| --- | --- |
| **Qué transmite** | Tiempo real: el ruido de noticias y redes se convierte en una lectura clara de reputación y en una estrategia |
| **Estética** | Redacción de noticias + terminal de datos. Base oscura o papel según la marca de Pirp (verificar en pirp.com.ar), tipografía editorial para titulares, un color de señal para alertas, verde/rojo sobrios para sentimiento |
| **Qué debe generar** | Vértigo controlado: sensación de velocidad seguida de claridad |
| **Integración con el proyecto** | Toma el lenguaje visual de Pirp (paleta y tipografía de su landing) y el tono de inteligencia política |

**Beats**

1. **Mundo** — el filamento se acelera y se convierte en una señal que late; el ritmo del scroll se siente más rápido.
2. **Problema** — un torrente de titulares y posts (tarjetas instanciadas) atraviesa la pantalla: imposible de leer.
3. **Razonamiento** — agentes (nodos) atrapan tarjetas, las clasifican por sentimiento (color) y por tema; el torrente se organiza en un grafo de temas que se agrupan.
4. **Solución** — aparece el termómetro de reputación con una curva de tendencia en vivo; un pico dispara una alerta.
5. **Resultado** — la alerta se resuelve en una propuesta de estrategia que se escribe sola (texto que se tipea); el ruido se calma.

**Interacción:** el visitante puede "tocar" una tarjeta del torrente para verla clasificada; arrastrar en el grafo lo deforma con inercia.

**Técnica**

- Titulares como **atlas de texturas** pre-renderizado en build (miles de tarjetas = un draw call), no texto SDF por tarjeta.
- Layout del grafo precalculado en build; en el navegador solo se interpola.
- **Datos ficticios** (políticos, medios y titulares inventados) para evitar problemas legales y de confidencialidad.

**Mobile:** el torrente pasa a ser vertical (como un feed), el grafo se compacta, la curva ocupa el ancho.

**Insumos del humano (T-H10):** marca de Pirp (logo, paleta, tipografía), 3–5 capturas del producto, validación del dataset ficticio y de los textos de estrategia, confirmación de qué se puede contar del proyecto (está activo).

### 3.3 Naturalis — "Orden sin esfuerzo"

| Análisis previo | Propuesta |
| --- | --- |
| **Qué transmite** | Calma y cuidado: la tecnología trabaja en silencio para que el equipo se dedique a atender |
| **Estética** | Luz de día, tonos claros y cálidos (crema, salvia, terracota, madera clara), plantas y macetas, cortina de lino que respira, camilla, sombras suaves horneadas, grano sutil. Ritmo lento. Es el único capítulo en tema claro |
| **Qué debe generar** | Relax; una pausa después de la velocidad de Pirp |
| **Integración con el proyecto** | Ambiente de centro de estética sin copiar su marca; minimalismo y naturaleza. Música suave opcional |

**Beats**

1. **Mundo** — el filamento se vuelve un tallo que crece y abre hojas; el fondo pasa de oscuro a claro (transición de tema de todo el sitio).
2. **Problema** — la sala aparece con una agenda de papel desordenada: turnos tachados, mensajes, cancelaciones.
3. **Razonamiento** — dos piezas conectadas: un teléfono (web app de clientes) y una notebook (Natuadmin) del kit de dispositivos; los turnos viajan como hojas del teléfono a la agenda del panel.
4. **Solución** — anochece en la sala: pequeñas luces hacen el trabajo repetitivo (turnos fijos generados, mails de confirmación, estadísticas) "mientras el equipo descansa".
5. **Resultado** — amanece: +650 clientes registrados, +60 turnos por mes. Calma total.

**Interacción:** arrastrar mueve la cortina y la luz; activar el sonido ambiente (control visible en este capítulo).

**Técnica**

- Sala modelada en Blender con **iluminación horneada** en un atlas; es la escena con mayor costo de assets, por eso se controla con LOD por nivel.
- Plantas low-poly o tarjetas alfa; cortina con shader de viento en vértices (barato).
- Ciclo día/noche resuelto mezclando dos lightmaps horneados, no con luces en tiempo real.

**Mobile:** encuadre vertical de una esquina de la sala (planta + camilla); el teléfono pasa al primer plano.

**Insumos del humano (T-H09):** modelado o assets con licencia (Poly Haven CC0, Sketchfab con licencia comercial) de macetas, plantas, camilla y cortina; pista de audio con licencia; capturas actualizadas de ambas apps.

### 3.4 Banner 2.0 — "Una decisión, diez mil pantallas"

| Análisis previo | Propuesta |
| --- | --- |
| **Qué transmite** | Escala con control: desde un único lugar se gobierna lo que muestran miles de pantallas |
| **Estética** | Oscuro industrial, las pantallas como única fuente de luz y color; paleta de Banner Director; precisión de sala de control |
| **Qué debe generar** | Sensación de potencia y escala |
| **Integración con el proyecto** | Usa el editor visual real (capturas existentes) como pieza flotante y la identidad de Banner Director |

**Beats**

1. **Mundo** — una sola pantalla en la oscuridad.
2. **Problema** — junto a ella aparecen cientos de pantallas descoordinadas, cada una mostrando algo distinto.
3. **Razonamiento** — el editor visual (capas de UI flotantes del kit) arma una plantilla; planos de filtro aplican las reglas (región, fecha, entidad).
4. **Solución** — publicar: el filamento se divide en miles de señales que atraviesan el broker de colas y los workers (grafo) y llegan a un mapa de ~10.000 pantallas que se encienden por región.
5. **Resultado** — zoom a un local: un videowall sincronizado. "≈10.000 equipos activos", logos de clientes (si hay permiso).

**Satélites (beats extra dentro del mismo mundo):**

- **App Etiquetas** — un teléfono en el local, ondas Wi‑Fi hacia una pantalla puntual que cambia a "sin stock" sin alterar las demás.
- **Web Landing** — una notebook del kit muestra la landing con sus secciones flotando: "la puerta de entrada comercial".

**Técnica:** 10.000 pantallas como un único `InstancedMesh` con estado por instancia en un shader; mapa estilizado como grilla de puntos; grafo de colas del kit.

**Mobile:** el mapa se recorta a una región; el videowall pasa a ser 2×2.

**Insumos del humano (T-H11):** paleta y logo de Banner Director, permiso para mostrar logos de clientes, 2–3 capturas del editor en alta resolución (ya hay 14 en el repo: elegir).

## 4. Segunda línea (viñetas con el kit)

| Proyecto | Concepto | Elemento distintivo | Beats |
| --- | --- | --- | --- |
| **Starbene** | "Toda la posventa en la palma de la mano" | Un equipo de medicina estética en vista explosionada; sus piezas se convierten en las secciones de la app (capacitación, documentación, recambios, servicio técnico) | Equipo → app en teléfono con capas flotantes → web comercial en notebook |
| **AGNT** | "El mercado de pases, ordenado" | Pizarra táctica: jugadores como nodos; los traspasos como arcos entre clubes; pulsos de sincronización con las APIs de fútbol | Pizarra → arcos de traspasos → panel |
| **Cielo y Mar** | "La calma del Caribe, en una vidriera" | Agua con shader de mar al atardecer; la suite aparece como una postal que se convierte en el sitio en una notebook | Mar → suite → sitio |

## 5. Tercera línea: el archivo

Sección 2D interactiva, sin WebGL propio: una lista tipográfica grande donde cada entrada (Venta Duplex, Arcor demo, Forme, Agro IA Tesis, Banner Teams) muestra al hover/tap una vista previa con una deformación suave y una línea que resume el problema resuelto. Cada entrada abre su página de caso breve. Es rápida de construir y refuerza que hay mucho más trabajo detrás.

## 6. Transiciones entre escenas

Toda transición tiene tres capas sincronizadas por el mismo progreso de scroll:

1. **Hilo conductor:** termina su forma en la escena saliente y empieza la nueva (por ejemplo, la trayectoria de la pelota de Vibo se acelera y se convierte en la señal de Pirp).
2. **Paleta:** las CSS variables del DOM interpolan hacia la paleta del capítulo entrante (`ScenePalette`), así texto y canvas cambian juntos.
3. **Cámara/escena:** crossfade por render target solo si hace falta; preferentemente, la escena entrante arranca en un encuadre que continúa al de la saliente.

Las transiciones se diseñan en pares (Vibo→Pirp, Pirp→Naturalis, Naturalis→Banner, etc.) y cada par tiene un dueño en el tablero, para que no queden "huérfanas" entre dos agentes.

## 7. Proceso de producción de cada escena

```text
Ficha validada por el humano (moodboard + análisis previo)
  → Greybox en /lab/<escena>: cámara, beats, ritmo, mobile, presupuesto (sin assets finales)
  → Revisión del humano (ritmo y encuadre)  ── iterar si hace falta
  → Assets finales por el pipeline + materiales + interacción
  → Integración en el recorrido + transiciones de su par
  → PR con métricas y capturas → aprobación del humano
```

**Exploración creativa en paralelo:** para el greybox de las escenas de primera línea conviene lanzar 2–3 variantes en worktrees separados (modo best-of-N) con la misma ficha, y que el humano elija. Cuesta poco y evita quedarse con la primera idea.
