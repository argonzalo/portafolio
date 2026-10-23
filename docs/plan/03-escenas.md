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

> **Ficha validada** (grilling T-H05, 2026-10-21). Frase concepto = placeholder (`conceptLine`); se cambiará después. Moodboard escrito basta para greybox.

| Análisis previo | Validado |
| --- | --- |
| **Qué transmite** | Ciencia aplicada al deporte: un video común se convierte en conocimiento preciso sobre cómo juega una persona, con un **toque leve de coaching** (mejora / “cómo jugaste”) |
| **Estética** | Noche, cancha iluminada (atmósfera de **replay TV**: reflectores, slow-mo comercial). Azul profundo (fondo), azul eléctrico (datos), dorado (momentos clave y resultado). Overlays con acento **HUD gamer** (glow, contraste fuerte), no lab clínico. Techo **cinematic stylized** (T-H06, 2026-10-22): humano creíble, luz/materiales premium, presupuesto web — no photoreal AAA ni low-poly de juguete. Evitar: bloques low-poly, cartoon, cyberpunk, infantil. |
| **Qué debe generar** | Asombro y confianza: "esto es serio, esto es preciso" |
| **Integración con el proyecto** | Manda la estética del portafolio para Vibo (`00` / esta ficha). Paleta oscuros/azules/dorado. `ui-mvp-public` solo como referencia suave de producto, no como look a copiar. En el golpe, lectura tipo broadcast; en grafo/métricas, lectura más de software de análisis |

**Concepto (placeholder):** `"Ver lo invisible del juego"` — guardar en variable de copy (`conceptLine`); no tratarlo como texto final.

**Beats** (4; el “problema” no es un acto aparte)

1. **Mundo** — el filamento dibuja las líneas de la cancha en la oscuridad; se encienden los reflectores.
2. **Razonamiento (núcleo; problema implícito)** — se pasa del video plano a un personaje 3D que ejecuta un golpe en *slow motion*. El problema (el video solo no explica el juego) se **insinúa**, sin énfasis ni copy largo. Sobre el jugador flotan detecciones como overlay (bounding boxes, pose keypoints, etiquetas). En paralelo, un grafo de agentes muestra el pipeline: detección → seguimiento → calibración de cancha → detección de golpes → clasificación; cada nodo se enciende cuando “decide”. Héroe visual = el **golpe**. Trayectoria de pelota estilizada (filamento); sin reconstrucción 3D fiel (ADR-011).
3. **Solución** — la cámara sube a vista cenital: mapa de calor de zonas, cobertura de cancha frente al compañero y los rivales, perfil ofensivo/defensivo.
4. **Resultado** — tarjeta de jugador con métricas (estilo, golpes más frecuentes, desgaste a lo largo del partido) en dorado; CTA al caso completo.

**Interacción**

- Scrub del golpe **obligatorio** en desktop y mobile (pause + arrastrar). En mobile: gesto amplio / control grande, sin pedir precisión fina.
- Overlays entran **solos** con la coreografía del beat (set fijo). Hover/tap = **solo highlight**, sin panel de dato.
- Grafo del pipeline: **solo visual** (progreso), no interactivo.
- Fuera de alcance: minijuegos, score, “jugá un punto”.
- Forma del hilo en Vibo: **sin fijar**; se decide en greybox.

**Técnica** (ADR-011)

- Cancha procedural (líneas y planos), sin modelo pesado.
- **Personaje 3D animado** estilizado-realista (rig con licencia tipo Mixamo/Ready Player u otro con calidad de proporciones humanas) con animación de golpe en slow motion; materiales PBR simples + iluminación de reflectores; silueta legible en mobile. El impacto está en el golpe + lectura broadcast, no en una trayectoria realista ni en photoreal de motor AAA.
- **Overlays de detección** anclados al personaje/espacio (HUD del kit), look con glow/acento fuerte: bounding boxes, pose keypoints y etiquetas, alimentados por JSON curado a partir de `analysisResults` reales (T-H07). Los datos del producto están en perspectiva de cámara y **no** bastan para trayectoria 3D fiel; acreditan el overlay, no reconstruyen el mundo.
- Trayectoria de pelota **diseñada** (filamento / curva con propósito), inspirada a lo sumo en el seguimiento real.
- Mapa de calor como shader sobre el plano de la cancha, con datos precalculados en build.

**Mobile**

- Beat núcleo: encuadre **cerrado** al jugador que **abre un poco** al scrubear.
- Overlays: set fijo coreografiado; tap solo para highlight.
- Grafo: tira vertical.
- Beats solución y resultado: ambos, con UI simplificada.
- Copy en DOM: **mínimo, 1 línea por beat**.

**Insumos del humano (T-H07):** export anonimizado de `analysisResults` (Firebase `vibo-beta` / `vibo-beta-2e60f`, colección `videos`) de 1–2 clips con al menos un golpe claro; JSON curado de overlays (bboxes + keypoints en la ventana del golpe); métricas de un jugador anonimizadas; confirmación de paleta y logo; permiso para mostrar datos. No se exige trayectoria 3D reconstruida.

**Decisión de assets 3D (I-12):** [`insumos/vibo-3d.md`](./insumos/vibo-3d.md) — jugador y paleta modelados a mano (jugador como esqueleto simple para flexión leve de rodillas y brazos; paleta optimizada), argumentos y nota sobre la animación simple del golpe (referencia volea).

### 3.2 Pirp — "Todo pasa rápido, y aun así se entiende"

> **Ficha validada** (grilling T-H05, 2026-10-22). Marca en `assets-src/pirp/brand/`. No nombrar al cliente del producto.

| Análisis previo | Validado |
| --- | --- |
| **Qué transmite** | Tiempo real: el ruido de noticias y redes se convierte en una lectura clara de reputación y en una estrategia |
| **Estética** | **Mixto, principalmente oscuro** (`dark.background` `#17181A`, superficies `#242425`). Destellos de papel/crema (`#EFE9DD`) en titulares o paneles puntuales, no como tema dominante. Acento/alerta: bordó `#7A1F2B` (dark accent `#A8434F`). Tipografía: **Poppins** + contraste tipográfico fuerte en titulares (peso/escala, no otra familia obligatoria). Sentimiento: verde/rojo sobrios |
| **Qué debe generar** | Vértigo controlado: sensación de velocidad seguida de claridad |
| **Integración con el proyecto** | Lenguaje visual de Pirp (paleta y tipografía de marca). Se pueden usar **capturas reales de UI** en escena; titulares/políticos/medios del torrente y dataset de demo = **ficticios** (T-H10) |

**Beats** (5)

1. **Mundo** — el hilo se acelera y se convierte en una señal que late; el ritmo del scroll se siente más rápido.
2. **Problema** — un torrente de titulares y posts (tarjetas instanciadas) atraviesa la pantalla: imposible de leer.
3. **Razonamiento** — agentes (nodos) atrapan tarjetas, las clasifican por sentimiento (color) y por tema; el torrente se organiza en un grafo de temas que se agrupan.
4. **Solución** — aparece el termómetro de reputación con una curva de tendencia en vivo; un pico dispara una alerta.
5. **Resultado** — la alerta se resuelve en una propuesta de estrategia que se escribe sola (texto que se tipea); el ruido se calma.

**Interacción**

- **Obligatorio:** tocar/tap una tarjeta del torrente para verla clasificada.
- **Grafo:** solo visual (progreso); no arrastrar ni deformar (nice-to-have descartado para greybox/G1).

**Técnica**

- Titulares como **atlas de texturas** pre-renderizado en build (miles de tarjetas = un draw call), no texto SDF por tarjeta.
- Layout del grafo precalculado en build; en el navegador solo se interpola.
- Capturas de producto reales como texturas de UI; datos del torrente/estrategia ficticios.

**Mobile:** el torrente pasa a ser vertical (como un feed), el grafo se compacta, la curva ocupa el ancho. Hilo = filamento (ADR-006).

**Insumos del humano (T-H10):** validación del dataset ficticio y de los textos de estrategia; alcance de qué se puede contar (I-08). Marca y capturas base ya en repo (I-03 / I-04).

### 3.3 Naturalis — "Orden sin esfuerzo"

> **Ficha validada** (grilling T-H05, 2026-10-22). Marca en `assets-src/naturalis/brand/`.

| Análisis previo | Validado |
| --- | --- |
| **Qué transmite** | Calma y cuidado: la tecnología trabaja en silencio para que el equipo se dedique a atender |
| **Estética** | **Marca:** salvia/teal (`primary` `#56857D`, accent `#81AAA4`) sobre crema suave `#FAFDFC` / blanco. Luz de día, plantas y macetas, cortina de lino, camilla, sombras suaves horneadas, grano sutil. Ritmo lento. **Único capítulo en tema claro** (obligatorio) |
| **Qué debe generar** | Relax; una pausa después de la velocidad de Pirp |
| **Integración con el proyecto** | Ambiente de centro de estética alineado a la paleta Naturalis; logo discreto permitido. Música suave cuando exista pista (I-06) |

**Beats** (5)

1. **Mundo** — el hilo se vuelve un tallo que crece y abre hojas; el fondo pasa de oscuro a claro (transición de tema de todo el sitio).
2. **Problema** — la sala aparece con una agenda de papel desordenada: turnos tachados, mensajes, cancelaciones.
3. **Razonamiento** — dos piezas conectadas: un teléfono (web app de clientes) y una notebook (Natuadmin) del kit de dispositivos; los turnos viajan como hojas del teléfono a la agenda del panel.
4. **Solución** — anochece en la sala: pequeñas luces hacen el trabajo repetitivo (turnos fijos generados, mails de confirmación, estadísticas) "mientras el equipo descansa".
5. **Resultado** — amanece: +900 clientes registrados, +70 turnos por mes. Calma total. Cifras confirmadas por el humano en T-A24 (2026-10-22).

**Interacción**

- Greybox/G1: scroll y cámara bastan.
- Arrastrar cortina/luz: **nice-to-have** (no bloquea greybox).
- Audio ambiente: **fuera del greybox**; entra cuando haya pista licenciada (T-H09 / I-06), con control visible.

**Técnica**

- Sala modelada en Blender con **iluminación horneada** en un atlas; es la escena con mayor costo de assets, por eso se controla con LOD por nivel.
- Plantas low-poly o tarjetas alfa; cortina con shader de viento en vértices (barato).
- Ciclo día/noche resuelto mezclando dos lightmaps horneados, no con luces en tiempo real.

**Mobile:** encuadre vertical de una esquina de la sala (planta + camilla); el teléfono pasa al primer plano. Hilo = filamento (ADR-006).

**Insumos del humano (T-H09):** modelado o assets con licencia (Poly Haven CC0, Sketchfab con licencia comercial) de macetas, plantas, camilla y cortina; pista de audio con licencia; capturas actualizadas de ambas apps.

**Investigación de assets 3D:** [`insumos/naturalis-3d.md`](./insumos/naturalis-3d.md) — recursos con licencias (CC0 / CC BY), qué falta modelar (camilla, cortina, piedras, sala) y optimización (pipeline, presupuestos, decisión abierta de triángulos).

### 3.4 Banner 2.0 — "Una decisión, diez mil pantallas"

> **Ficha validada** (grilling T-H05, 2026-10-22). Marca en `assets-src/banner/brand/`.

| Análisis previo | Validado |
| --- | --- |
| **Qué transmite** | Escala con control: desde un único lugar se gobierna lo que muestran miles de pantallas |
| **Estética** | Oscuro industrial (`#151211` / `#0F0D0C`); pantallas como única fuente de luz y color; acento naranja/coral de marca (`#DA3E00` / `#FFB5A0`). Precisión de sala de control |
| **Qué debe generar** | Sensación de potencia y escala |
| **Integración con el proyecto** | Editor visual real (capturas existentes) como pieza flotante; identidad Banner Director |

**Beats** (5 del mundo Banner; satélites aparte)

1. **Mundo** — una sola pantalla en la oscuridad.
2. **Problema** — junto a ella aparecen cientos de pantallas descoordinadas, cada una mostrando algo distinto.
3. **Razonamiento** — el editor visual (capas de UI flotantes del kit) arma una plantilla; planos de filtro aplican las reglas (región, fecha, entidad).
4. **Solución** — publicar: el hilo se divide en miles de señales que atraviesan el broker de colas y los workers (grafo) y llegan a un mapa de ~10.000 pantallas que se encienden por región.
5. **Resultado** — zoom a un local: un videowall sincronizado. "≈10.000 equipos activos"; logos de clientes con placeholders en greybox (archivos reales en T-H11).

**Satélites** (T-A29, no en greybox T-A14-banner):

- **App Etiquetas** — un teléfono en el local, ondas Wi‑Fi hacia una pantalla puntual que cambia a "sin stock" sin alterar las demás.
- **Web Landing** — una notebook del kit muestra la landing con sus secciones flotando: "la puerta de entrada comercial".

**Interacción (greybox):** solo scroll/cámara; el “publicar” es animación coreografiada, no gesto obligatorio.

**Técnica:** 10.000 pantallas como un único `InstancedMesh` con estado por instancia en un shader; mapa estilizado como grilla de puntos; grafo de colas del kit.

**Mobile:** el mapa se recorta a una región; el videowall pasa a ser 2×2. Hilo = filamento (ADR-006).

**Insumos del humano (T-H11):** archivos de logo de clientes autorizados (nombres OK en copy); 2–3 capturas del editor elegidas en alta (hay set en `public/images/proyects/`). Paleta/logo Banner ya en `assets-src/banner/brand/`.

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

1. **Hilo conductor (ADR-006):** misma curva en desktop (enjambre) y mobile (filamento); termina su forma en la escena saliente y empieza la nueva (por ejemplo, la trayectoria de la pelota de Vibo se acelera y se convierte en la señal de Pirp).
2. **Paleta:** las CSS variables del DOM interpolan hacia la paleta del capítulo entrante (`ScenePalette`), así texto y canvas cambian juntos.
3. **Cámara/escena:** crossfade por render target solo si hace falta; preferentemente, la escena entrante arranca en un encuadre que continúa al de la saliente.

Las transiciones se diseñan en pares (Vibo→Pirp, Pirp→Naturalis, Naturalis→Banner, etc.) y cada par tiene un dueño en el tablero, para que no queden "huérfanas" entre dos agentes.

## 8. Rúbrica y Guía de Arte Vinculante (T-H12)

> Aprobada en el grilling de T-H12 (2026-10-22). Aplica de manera obligatoria a todas las escenas de primera y segunda línea para evitar el look amateur / low-poly genérico y garantizar el estándar *cinematic stylized*.

### 8.1 Reglas técnicas obligatorias para agentes ejecutores

1. **Prohibición de primitivas desnudas:** Quedan terminantemente prohibidos cubos, cilindros o esferas lisas sin biselar (*bevel*), sin mapas de normales/rugosidad o con colores planos plásticos por defecto.
2. **Esquema de iluminación de 3 puntos mínimo:** Cada escena debe contar con una clave de luz calculada:
   - **Key light:** Luz principal direccional o foco que modela la forma.
   - **Fill light:** Relleno ambiental suave o luz secundaria que preserva detalle en sombras.
   - **Rim light:** Luz de contorno intensa (típicamente azul/dorada en escenas oscuras) que separa los modelos del fondo y genera el recorte broadcast.
3. **Calibración PBR rigurosa:** Todos los materiales deben declarar valores explícitos y creíbles de `roughness` (aspereza), `metalness` (metalicidad) y mapas ambientales (PMREM de estudio compartido proveniente del kit).
4. **Tipografía y gráficos vectoriales nítidos:** Textos y etiquetas en 3D deben usar SDF (Signed Distance Fields) o capas DOM ancladas en alta resolución con Poppins y `tabular-nums`.

### 8.2 Directivas específicas por escena

- **Vibo (T-A20):**
  - **Jugador:** Atleta humanoide con proporciones reales, rig atlético (15–25k triángulos), vestimenta deportiva con materiales PBR semi-mate y fuerte iluminación de reflectores estilo repetición televisiva nocturna.
  - **Cancha:** Cancha de pádel completa estilizada (suelo oscuro con textura sutil, paredes de cristal templado PBR con reflejos y red/postes estilizados bajo reflectores).
  - **Overlays:** HUD de visión artificial con glow y datos curados de Firebase (T-H07), sin reconstrucción geométrica forzada.
- **Pirp (T-A23):**
  - **Torrente de noticias:** Tarjetas con diseño editorial en Poppins montadas en un atlas de texturas eficiente, badges de sentimiento sobrios (verde esmeralda / rojo quemado) y acento de alerta en bordó corporativo (`#7A1F2B`).
- **Naturalis (T-A24):**
  - **Ambiente:** Sala de estética y bienestar arquitectónica y cálida. Paleta salvia (`#56857D`) sobre crema suave (`#FAFDFC`), lino y vegetación con sombras horneadas (lightmap) y transición suave a luz nocturna azulada. Único capítulo en tema claro.
- **Banner 2.0 (T-A25):**
  - **Sala de control:** Pantallas físicas con marcos de aluminio oscuros usando el kit de dispositivos (T-A19), paneles con emisiones calibradas y acento naranja (`#DA3E00`). El videowall de 10.000 pantallas actúa como una matriz LED de alta precisión.
- **Capturas de producto (T-A42):**
  - Dispositivos 3D del kit integrados en el espacio con capas de UI flotantes + gatillador accesible para abrir carousel/lightbox en DOM de alta resolución.

