# 00 — Visión y concepto

## 1. Interpretación del pedido

La descripción de producto pide cambiar **tres cosas a la vez**, y el plan las trata como ejes separados para poder trabajarlas en paralelo:

| Eje | Hoy | Objetivo |
| --- | --- | --- |
| **Mensaje** | "Desarrollador end-to-end que conoce X tecnologías" | "Resuelvo problemas de negocio con producto, automatización e IA". Cabecera comercial, tags de valor, frases cortas |
| **Forma** | Documento estático: secciones apiladas y tarjetas | Recorrido dinámico, inmersivo, con 3D, 2D y movimiento; poco estructurado en apariencia, muy estructurado por dentro |
| **Interacción** | Ninguna más allá del scroll | Escenas que explican cada proyecto interactivamente + un agente de IA que acompaña la sesión |

Restricciones no negociables que atraviesan los tres ejes: **alto rendimiento**, **desktop y mobile por igual**, **API key nunca en el frontend**, **límite de uso del agente por IP/sesión**, **concepto propio** (las referencias son contexto, no modelo).

### Lo que el producto NO es

- No es un videojuego ni un recorrido libre en 3D (se descarta el estilo Funtech): el visitante avanza con scroll/gestos, la cámara está dirigida.
- No es una grilla de tarjetas con efectos encima.
- No es una vitrina de tecnologías: el stack aparece, pero en segundo plano y nunca como titular.
- No es "todo 3D": el 3D se usa donde explica algo; el resto es tipografía, 2D y movimiento.

## 2. Concepto rector: "Una sola mente"

El visitante no recorre un listado de proyectos: **recorre la forma de pensar de una persona**. Cada proyecto es un *capítulo* donde esa mente entra en un mundo distinto (la cancha de pádel, la redacción en tiempo real, el centro de estética, la red de pantallas), entiende el problema, lo descompone y lo resuelve frente al visitante.

Esto da la regla para cada escena: **mostrar el razonamiento, no solo el resultado**. En Vibo no basta con ver la cancha; hay que ver cómo el sistema *entiende* el golpe (marca articulaciones, calcula la zona, decide el tipo de golpe). En Banner no basta con ver pantallas; hay que ver cómo *una* decisión llega a diez mil.

### Estructura de cada capítulo (patrón narrativo común)

Todas las escenas de primera línea siguen el mismo arco en cinco tiempos (*beats*), aunque cada una lo cuente con su estética:

1. **Mundo** — aparece el contexto (la cancha, la sala, la red). Una línea de texto: qué problema existe.
2. **Problema** — se ve la fricción real (el video crudo que nadie entiende, el ruido de noticias, la agenda caótica, las pantallas descoordinadas).
3. **Razonamiento** — la mente descompone el problema: nodos, agentes, capas, overlays. Es el momento de mayor impacto visual.
4. **Solución** — el sistema funcionando: la escena se ordena.
5. **Resultado** — impacto concreto (métricas, escala, clientes) y salida hacia el caso completo o al siguiente capítulo.

Este patrón es lo que permite que distintos agentes produzcan escenas distintas sin que el sitio se sienta inconexo, y es lo que el agente de IA usa para saber "dónde" está el visitante.

## 3. Recorrido de la home (propuesta)

Recorrido vertical con scroll dirigido, cíclico al final. Orden propuesto (el orden de prioridad de la descripción se respeta; las posiciones de la segunda línea son una propuesta, ver ADR-007):

| # | Capítulo | Tipo | Tono | Por qué en este lugar |
| --- | --- | --- | --- | --- |
| 0 | **Apertura / Hero** | Tipografía + hilo | Neutro, cálido | Comunica en 3 segundos quién y qué: "Tu próxima gran idea hecha realidad" |
| 1 | **Cómo pienso** (manifiesto breve) | 2D + hilo | Neutro | Las tres frases ("Pienso productos / Diseño experiencias / Construyo tecnología") como transición hacia los proyectos |
| 2 | **Vibo** | Escena inmersiva | Oscuro, azul, dorado: ciencia y deporte | Máximo impacto al inicio |
| 3 | **Pirp** | Escena inmersiva | Rápido, tiempo real, editorial | Sube la velocidad |
| 4 | **Naturalis** | Escena inmersiva | Claro, calma, naturaleza | Contraste deliberado: después de la velocidad, la pausa (y el cambio a tema claro) |
| 5 | **Banner 2.0** | Escena inmersiva | Oscuro, pantallas, escala | Cierra la primera línea con la idea de escala |
| 5b | App Etiquetas · Web Landing | Satélites del mundo Banner | Igual que Banner | Reutilizan la escena de Banner: coherentes y baratos |
| 6 | **Starbene · AGNT · Cielo y Mar** | Viñetas (kit) | Cada una con su paleta | Segunda línea: impacto medio, costo bajo |
| 7 | **Archivo** | 2D interactivo | Neutro | Tercera línea: Venta Duplex, Arcor demo, Forme, Agro IA Tesis, Banner Teams |
| 8 | **Quién soy** | 2D + foto + hilo | Cálido | Lo humano (música, deporte: el pádel conecta con Vibo) |
| 9 | **Hablemos** | CTA | Neutro | Contacto. El hilo vuelve a su forma inicial y cierra el ciclo hacia el hero |

**Accesos rápidos obligatorios** (para quien tiene 30 segundos, por ejemplo un reclutador o un cliente apurado):

- **Índice** siempre disponible (menú overlay): salta a cualquier capítulo o proyecto.
- **Vista lista**: todos los proyectos en formato clásico, accesible y liviano. Es también el fallback sin WebGL.
- **Contacto** visible en todo momento.

Cada proyecto tiene además su **página propia** (`/projects/<id>`) con el caso completo en formato problema → enfoque → decisiones → resultado. Es lo que se comparte por link, lo que indexa Google y donde se profundiza.

## 4. Hilo conductor visual

La descripción deja la decisión abierta. El plan la **acota en el tiempo** porque afecta la arquitectura (el hilo tiene que vivir en una capa persistente por encima de todas las escenas): se prototipan tres opciones en F0 (T-A08) y el humano elige antes de G1 (ADR-006).

| Opción | Cómo se ve | Cómo muta por escena | Pros | Contras |
| --- | --- | --- | --- | --- |
| **A. El filamento** (recomendada) | Una única línea de luz continua que se dibuja con el scroll | Vibo: líneas de la cancha y trayectoria de la pelota · Pirp: señal que se ramifica en un grafo de temas · Naturalis: tallo que crece y se vuelve planta · Banner: cable que se divide en miles de señales hacia las pantallas | Barata (una curva + shader), legible en mobile, se integra con cualquier estética, expresa "pensamiento que conecta" | Riesgo de verse genérica si no se trabaja el shader |
| **B. La forma mutante** | Un objeto geométrico que cambia de forma (morphing) | Pelota → nodo → semilla → pantalla | Muy icónica, fuerte para el hero | Más costosa de modelar; morphing entre topologías distintas es complejo |
| **C. El enjambre** | Nube de partículas que se reorganiza | Forma el jugador, el titular, la hoja, el mapa | Espectacular | La más cara en GPU; riesgo alto en mobile |

**Recomendación:** A como hilo principal, con la posibilidad de que en momentos puntuales el filamento "se condense" en una forma (toma lo mejor de B sin su costo). El sonido (textura que cambia por escena) queda como capa secundaria opcional.

**Sinergia clave con el agente de IA:** el guía atento puede *ser* la punta del filamento. Cuando el agente habla, el hilo se acerca; cuando ejecuta una acción ("te llevo a cómo se detectan los golpes"), el visitante ve al hilo moverse y llevarlo. Así el agente es visible trabajando sin agregar un avatar ajeno al concepto.

## 5. Voz y tono del texto

- Frases cortas, afirmativas, en segunda persona hacia el visitante cuando se habla de valor ("Tu próxima gran idea hecha realidad") y en primera persona cuando se habla del método ("Pienso productos").
- Cada texto responde a "¿qué problema resolví y por qué importa?", nunca "¿qué tecnología usé?".
- Las cifras son protagonistas cuando existen (≈10.000 equipos, +650 clientes, +60 turnos por mes).
- El stack aparece al final de cada caso, colapsado, como dato de respaldo.

## 6. Criterios de éxito (cómo sabemos que está bien hecho)

**En 3 segundos** el visitante sabe quién es y qué ofrece (hero en HTML, visible antes de que cargue el 3D).

**En 30 segundos** vio al menos una escena impactante y sabe que puede pedir un proyecto.

**Después de explorar** entiende cómo se piensa y resuelve un problema (al menos un capítulo de primera línea recorrido completo).

**Medibles:**

| Métrica | Objetivo |
| --- | --- |
| LCP (mobile, p75) | ≤ 2,5 s · objetivo de laboratorio ≤ 2,0 s |
| INP | ≤ 150 ms |
| CLS | ≤ 0,05 |
| FPS sostenidos | 60 en desktop · ≥ 50 en Android medio · nunca < 30 en gama baja (baja a nivel `low`/`static`) |
| Lighthouse Performance (mobile) | ≥ 90 en la home con el 3D cargando diferido |
| Accesibilidad (Lighthouse) | ≥ 95 |
| Capítulo 2 (Vibo) alcanzado | ≥ 60 % de las sesiones (analítica) |
| Clic en contacto | Se mide desde el lanzamiento para iterar |
| Costo del agente IA | Por debajo del tope diario configurado; 0 incidentes de abuso |
