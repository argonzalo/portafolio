# Descripciones de proyectos — originales y versiones

Respaldo de las descripciones (campo `description`) de `src/lib/projects.ts`. Cada entrada muestra el texto **original** (verbatim), la **Versión 1** (primera reescritura, 21/10/2026) y la **Versión 2** (reescritura con criterio de impacto, 21/10/2026).
Las entradas siguen la estructura anterior (organización > subproyectos). Ver al final la sección *Estructura anterior* y la *Estructura nueva (lista plana)*.

---

## Banner Director (`banner-director`)

**Original:**

> Plataforma de Digital Signage que permite gestionar de forma centralizada el contenido de miles de pantallas en múltiples locales. Actualmente cuenta con casi 10.000 equipos activos y clientes como Grido, Açaí, Marea, Diarco y Leroma, entre otros.

**Versión 1:**

> Plataforma de Digital Signage que resuelve un problema operativo concreto: mantener bajo control, desde un único punto, el contenido de miles de pantallas distribuidas en múltiples locales. Desde un panel central se define qué se reproduce, dónde y cuándo; la plataforma traduce esas reglas en configuraciones por equipo, procesa los medios y los distribuye de forma asíncrona a reproductores Android que descargan, interpretan y ejecutan la programación de manera autónoma. El ecosistema combina una plataforma histórica con una nueva generación orientada a servicios, y suma proyectos satélite como analítica de personas mediante visión on-device. Hoy cuenta con casi 10.000 equipos activos y clientes como Grido, Açaí, Marea, Diarco y Leroma, entre otros.

**Versión 2:**

> Plataforma de Digital Signage que permite a grandes cadenas y franquicias controlar, desde un único lugar, lo que muestran miles de pantallas en múltiples locales: qué se ve, dónde y cuándo, sin intervenir equipo por equipo. Cada pantalla ejecuta su programación de forma autónoma y se mantiene alineada con las decisiones centrales, lo que permite escalar la operación a miles de equipos sin perder el control. Actualmente cuenta con casi 10.000 equipos activos y clientes como Grido, Açaí, Marea, Diarco y Leroma, entre otros.

### Subproyecto: Banner 2.0 (`banner-director/banner-2`)

**Original:**

> Sistema de Digital Signage para grandes franquicias, basado en tres pilares: interfaz gráfica en Vue, con un potente editor visual para crear y gestionar contenido; backend en Go y base de datos PostgreSQL; y Android / Kotlin para la operación y reproducción de contenido en los equipos. El sistema permite administrar contenidos con configuraciones avanzadas por regiones, fechas, entidades y más.

**Versión 1:**

> Nueva generación de la plataforma, pensada para grandes franquicias. El operador diseña el contenido en un editor visual de plantillas y define reglas de segmentación por regiones, fechas, entidades, criterios y etiquetas; cada publicación se convierte en un mensaje de nueva configuración que viaja por un broker de colas hasta cada equipo. Del lado servidor, una API en Go expone REST, archivos y WebSocket; workers dedicados consumen colas con prioridades y un procesador de medios normaliza video, imágenes y audio (incluido videowall) antes de distribuirlos. En el dispositivo, una app Android en Kotlin con launcher en modo kiosco descarga los assets, interpreta la plantilla y reproduce el contenido, con sincronización opcional entre pantallas. Las nuevas versiones de servicios y APKs se publican desde el propio panel.

**Versión 2:**

> Nueva generación de la plataforma, pensada para grandes franquicias: permite decidir con precisión qué contenido se ve en cada pantalla según región, fecha, entidad y más, y publicarlo en toda la red desde un potente editor visual. Cada equipo recibe su configuración y la reproduce de forma autónoma, con la robustez necesaria para operar a escala. Construida sobre servicios en Go, un panel en Vue y una app Android nativa en Kotlin.

### Subproyecto: App Etiquetas (`banner-director/app-etiquetas`)

**Original:**

> App mobile para la configuración local — conexión desde la misma red Wi‑Fi a los equipos — para gestionar contenido de forma particular, sin alterar la configuración global. Especialmente útil para la gestión de disponibilidad de productos.

**Versión 1:**

> Herramienta mobile que resuelve el último tramo de la operación: ajustar el contenido de un equipo puntual desde el propio local, sin tocar la configuración global de la plataforma. La app se conecta a los equipos a través de la misma red Wi‑Fi y aplica cambios locales que conviven con la programación central sin pisarla. Especialmente útil para la gestión de disponibilidad de productos: el personal del local refleja en pantalla lo que hay y lo que no, mientras la estrategia de contenido sigue gobernada de forma centralizada.

**Versión 2:**

> Control local e inmediato del contenido de cada pantalla, sin tocar la configuración global. Desde el celular y conectado a la misma red Wi‑Fi que los equipos, el personal del local ajusta lo que muestra un equipo puntual —especialmente la disponibilidad de productos— mientras la estrategia de contenido sigue gobernada de forma centralizada.

### Subproyecto: Web Landing (`banner-director/web-landing`)

**Original:**

> Sitio web de la empresa.

**Versión 1:**

> Sitio web institucional de la empresa. Comunica la propuesta de cartelería digital centralizada y sus soluciones, y funciona como puerta de entrada comercial para nuevos clientes.

**Versión 2:**

> Puerta de entrada comercial de Banner Director: sitio institucional que comunica la propuesta de cartelería digital centralizada y sus soluciones a potenciales clientes.

### Subproyecto: Banner Teams (`banner-director/teams`)

**Original:**

> Sistema interno de la empresa para la gestión de tareas, clientes, ventas, seguimiento de envíos y operación diaria del equipo.

**Versión 1:**

> Sistema interno que concentra la operación diaria de la empresa en una única fuente de verdad: gestión de tareas, clientes, ventas y seguimiento de envíos. Al reunir estos dominios en un mismo modelo de datos, el equipo puede seguir a cada cliente desde la venta hasta la entrega y coordinar el trabajo diario desde un solo lugar.

**Versión 2:**

> Una única fuente de verdad para la operación interna de la empresa: tareas, clientes, ventas y seguimiento de envíos en un mismo sistema, para acompañar a cada cliente desde la venta hasta la entrega y coordinar el trabajo diario del equipo desde un solo lugar.

---

## VIBO — Pádel Análisis (`vibo`)

**Original:**

> El usuario registra su partido en video y la plataforma procesa el material mediante una combinación de algoritmos de visión por computadora, inteligencia artificial y modelos matemáticos para extraer datos del juego, reconstruir y analizar diferentes eventos y generar métricas de rendimiento e información relevante para evaluar y mejorar el desempeño.

**Versión 1:**

> Plataforma que convierte el video de un partido de pádel en datos de juego accionables. El usuario sube su partido y un pipeline asíncrono en la nube se encarga del resto: normaliza el video, detecta y sigue a jugadores y pelota cuadro a cuadro, calibra la cancha para pasar de píxeles a metros reales, reconstruye trayectorias, separa los tramos de juego activo y detecta los golpes. Sobre esa base combina visión por computadora, inteligencia artificial y modelos matemáticos para generar métricas de rendimiento —distancia, velocidad, intensidad, posicionamiento y ritmo de juego— y avisa al jugador cuando el análisis está listo. El objetivo: que cada jugador entienda su partido en datos y sepa qué mejorar.

**Versión 2:**

> Análisis inteligente de partidos de pádel que revela cómo juega realmente cada jugador. VIBO identifica su estilo de juego y si es más ofensivo o defensivo, compara cómo se reparte el juego con su compañero y cuánta cancha cubre en relación con él y con los rivales. Mide su dinámica de movimiento —qué tan rápido y ágil se desplaza y si se cansa a medida que avanza el partido—, muestra qué tipos de golpe ejecuta con más frecuencia y en qué zonas de la cancha se mueve más, y permite compartir los resultados con otros jugadores. Todo se apoya en inteligencia artificial y visión por computadora para convertir cada partido en información concreta para mejorar.

### Subproyecto: Pádel Video Análisis (`vibo/padel-video-analisis`)

**Original:**

> Backend en Python. Incluye el entrenamiento de modelos, el desarrollo de algoritmos para la extracción de datos de juego y el despliegue en Google Cloud.

**Versión 1:**

> Motor de análisis en Python que transforma video crudo en eventos de juego. Trabaja en varias pasadas: primero detecta y sigue a los jugadores y ubica los puntos clave de la cancha, con los que calcula una homografía que proyecta cada posición sobre coordenadas reales. Luego rastrea la pelota y depura su trayectoria con filtros de Kalman, descarte de reflejos y detecciones estáticas y unificación de trayectorias; estima la pose de cada jugador y recorta automáticamente los tramos sin juego válido. Los golpes se infieren con lógica de pádel: cada cruce de red implica un impacto previo, que se busca hacia atrás en la trayectoria y se asigna al jugador más cercano. Después se clasifican cruzando zona de cancha, altura de la muñeca respecto de ojos y hombros y tipo de golpe (drive o revés) para distinguir voleas, smash/bandeja, golpes de fondo y bajadas de pared. Incluye el entrenamiento de modelos de detección y el despliegue en Google Cloud: el video se sube por URL firmada, se procesa en contenedores con GPU, los resultados se fragmentan en la base de datos y el usuario recibe una notificación push al finalizar.

**Versión 2:**

> El motor que entiende el juego de cada jugador: detecta su estilo y su perfil ofensivo o defensivo, el reparto de juego con su compañero, la cancha que cubre frente a compañero y rivales, su velocidad, agilidad y desgaste a lo largo del partido, sus golpes más frecuentes y sus zonas dominantes. Funciona con modelos de inteligencia artificial y visión por computadora entrenados para el pádel y desplegados en la nube.

### Subproyecto: Web Demo (`vibo/web-demo`)

**Original:**

> Sitio web demo para la presentación inicial e interna del proyecto.

**Versión 1:**

> Sitio web demo para la presentación inicial e interna del proyecto. Materializó la propuesta de VIBO en una experiencia navegable, útil para validar la idea y alinear qué datos y visualizaciones debía ofrecer el producto antes de construir la plataforma definitiva.

**Versión 2:**

> Demo navegable con la que se presentó VIBO por primera vez: llevó a una experiencia visual la propuesta del producto —entender el juego de cada jugador a partir de sus datos— para validar la idea interna e inicialmente antes de construir la plataforma definitiva.

---

## Naturalis — Centro de estética (`naturalis`)

**Original:**

> Plataforma para un centro de estética: el equipo administra turnos, tratamientos, horarios y comunicación, mientras los clientes reservan y consultan su agenda desde la web.

**Versión 1:**

> Plataforma integral para un centro de estética que digitaliza todo el ciclo del turno. Los clientes reservan y siguen su agenda desde la web, mientras el equipo administra turnos, tratamientos, horarios, personal y comunicación desde un panel propio. Ambas aplicaciones comparten la misma base de datos, y una capa de funciones serverless automatiza el trabajo repetitivo: genera cada noche los turnos fijos con anticipación, envía mails de confirmación y cancelación ante cada cambio y mantiene actualizadas las estadísticas de cada cliente sin intervención manual.

**Versión 2:**

> Plataforma que digitaliza la gestión completa de un centro de estética: los clientes reservan y siguen su agenda online, y el equipo administra turnos, tratamientos, horarios y comunicación desde un panel propio. Automatiza el trabajo repetitivo —turnos fijos, confirmaciones y cancelaciones por mail, estadísticas de cada cliente— para que el equipo se enfoque en atender y no en administrar.

### Subproyecto: Natuadmin (`naturalis/natuadmin`)

**Original:**

> Sistema administrativo. Permite a los empleados gestionar turnos, información de tratamientos, horarios y mails. Incluye un editor de texto enriquecido para el blog y el envío de novedades.

**Versión 1:**

> Sistema administrativo que centraliza la operación del centro. Los empleados gestionan turnos (incluidos turnos recurrentes y cancelaciones), tratamientos, horarios y personal, con historial y un canal de notas por cliente vinculado a cada turno. Ante cualquier alta, cambio o baja de un turno, un trigger idempotente recalcula las estadísticas del cliente, y el panel las usa para rankear asistencia y cancelaciones con el límite inferior del intervalo de Wilson, de modo que un cliente con pocos turnos no distorsione el ranking. Suma un editor de texto enriquecido para el blog, el envío de mails y novedades, y procesamiento de imágenes en el servidor para optimizar lo que se publica.

**Versión 2:**

> El centro de operaciones del equipo: turnos (incluidos recurrentes y cancelaciones), tratamientos, horarios, personal, blog y mailing en un solo panel. Permite conocer a cada cliente por su historial, sus notas y sus estadísticas de asistencia y cancelación, que se actualizan solas y alimentan rankings estadísticamente confiables. Incluye un editor de texto enriquecido para el blog y el envío de novedades.

### Subproyecto: Web App (`naturalis/web-app`)

**Original:**

> Interfaz para los clientes. Les permite reservar y consultar turnos, ver los tratamientos disponibles y seguir el estado de su agenda.

**Versión 1:**

> Interfaz para los clientes. Guía la reserva de turnos en un flujo paso a paso hasta la confirmación y permite consultar los tratamientos disponibles y seguir el estado de la agenda desde el perfil. Cada reserva impacta directamente en la agenda que opera el equipo y dispara de forma automática el mail de confirmación. Incluye además el blog del centro.

**Versión 2:**

> Reserva de turnos online, simple y autónoma: los clientes eligen tratamiento, reservan, reciben la confirmación por mail y siguen el estado de su agenda desde su perfil. Cada reserva impacta directamente en la agenda del equipo.

---

## AGNT (`agnt`)

**Original:**

> Permite a las agencias gestionar representantes, jugadores, órdenes de clubes y traspasos. Se conecta con distintas APIs de fútbol para mantener actualizada la información.

**Versión 1:**

> Plataforma de gestión para agencias de representación de jugadores de fútbol. Centraliza en un único sistema a los representantes, la cartera de jugadores, las órdenes de los clubes y los traspasos, para que la agencia pueda seguir cada operación de punta a punta. Se conecta con distintas APIs de fútbol para sincronizar y mantener actualizada la información de los jugadores sin carga manual, de modo que las decisiones se tomen siempre sobre datos vigentes.

**Versión 2:**

> Plataforma que ordena el negocio de las agencias de representación de jugadores de fútbol: representantes, cartera de jugadores, órdenes de clubes y traspasos en un único sistema, para seguir cada operación de punta a punta. Se mantiene actualizada de forma automática gracias a la integración con distintas APIs de fútbol, para que las decisiones se tomen siempre sobre datos vigentes.

---

## Starbene — Medicina estética (`starbene`)

**Original:**

> Marca de medicina estética. El trabajo cubrió una app para clientes — gestión de equipos, capacitación, documentación, recambios y servicios de reparación — y un sitio comercial de productos, soluciones y cursos.

**Versión 1:**

> Ecosistema digital para una marca de medicina estética que comercializa equipos, capacitación y servicio técnico. El trabajo cubrió dos frentes: una app para clientes que concentraba la posventa de cada equipo —capacitación, documentación, compra de recambios y solicitud de servicios de reparación— y un sitio comercial que presenta productos, soluciones y cursos.

**Versión 2:**

> Ecosistema digital para una marca de medicina estética: una app que concentraba toda la posventa de sus equipos —capacitación, documentación, recambios y servicio técnico— y un sitio comercial que presenta productos, soluciones y cursos.

### Subproyecto: App Mobile (`starbene/app-mobile`)

**Original:**

> Aplicación mobile para clientes. Permitía gestionar equipos, capacitarse y obtener documentación, comprar recambios y solicitar servicios de reparación.

**Versión 1:**

> Aplicación mobile para clientes pensada como canal de posventa: cada cliente gestionaba sus equipos y, a partir de ellos, accedía a capacitación y documentación, compraba recambios y solicitaba servicios de reparación desde un único lugar.

**Versión 2:**

> Toda la posventa de los equipos en una sola app para clientes: gestión de sus equipos, capacitación, documentación, compra de recambios y solicitud de servicios de reparación.

### Subproyecto: Web App (`starbene/web-landing`)

**Original:**

> Web comercial. Listaba productos, soluciones, cursos y la oferta de la marca.

**Versión 1:**

> Web comercial de la marca. Organiza y presenta el catálogo de productos, las soluciones y la oferta de cursos, funcionando como vidriera digital de todo lo que ofrece la marca.

**Versión 2:**

> Vidriera digital de la marca: presenta de forma clara el catálogo de productos, las soluciones y la oferta de cursos.

---

## Varios (`varios`)

**Original:**

> Proyectos variados: desde productos terminados hasta demos y MVPs que no llegaron a producción.

**Versión 1:**

> Proyectos variados: desde productos terminados hasta demos y MVPs que no llegaron a producción. Piezas puntuales donde el foco estuvo en validar ideas rápido, presentar propuestas y resolver necesidades concretas con el alcance justo.

**Versión 2:**

> Productos terminados, demos y MVPs que no llegaron a producción: piezas puntuales para validar ideas rápido, presentar propuestas y resolver necesidades concretas con el alcance justo.

### Subproyecto: Venta Duplex (`varios/venta-duplex`)

**Original:**

> Sitio web para la presentación de un dúplex a la venta.

**Versión 1:**

> Sitio web para la presentación de un dúplex a la venta: una pieza enfocada en mostrar la propiedad de forma atractiva y concentrar en un solo lugar la información clave para potenciales compradores.

**Versión 2:**

> Presentación digital de un dúplex a la venta: muestra la propiedad de forma atractiva y concentra en un solo lugar la información clave para potenciales compradores.

### Subproyecto: Agro IA Tesis (`varios/agro-ia-tesis`)

**Original:**

> Sitio web para la presentación de un proyecto de tesis de un curso de inteligencia artificial en Barcelona, España.

**Versión 1:**

> Sitio web para la presentación de un proyecto de tesis de un curso de inteligencia artificial en Barcelona, España. Traduce el trabajo de investigación en una presentación web clara y navegable.

**Versión 2:**

> Presentación web de un proyecto de tesis de un curso de inteligencia artificial en Barcelona, España: convierte el trabajo de investigación en una experiencia clara y navegable.

### Subproyecto: Arcor demo (`varios/arcor-demo`)

**Original:**

> Web app simple para la demo de un sistema de premios en kioscos Arcor.

**Versión 1:**

> Web app liviana para la demo de un sistema de premios en kioscos Arcor: un prototipo funcional para mostrar la mecánica de premios y presentar la propuesta antes de avanzar con un desarrollo completo.

**Versión 2:**

> Prototipo funcional de un sistema de premios para kioscos Arcor: una web app liviana para mostrar la mecánica de premios y presentar la propuesta antes de un desarrollo completo.

### Subproyecto: Cielo y Mar — Suites (`varios/cielo-y-mar`)

**Original:**

> Sitio web para un hotel en Playa del Carmen, México.

**Versión 1:**

> Sitio web para un hotel en Playa del Carmen, México: presenta las suites y la propuesta del hotel, y funciona como vidriera digital para atraer huéspedes.

**Versión 2:**

> Vidriera digital de un hotel en Playa del Carmen, México: presenta las suites y la propuesta del hotel para atraer huéspedes.

### Subproyecto: Análisis de reputación política (`varios/analisis-rep-politica`)

**Original:**

> App web para políticos: recopila la información del usuario en noticias y redes, analiza tendencias e imagen, y propone estrategias a seguir.

**Versión 1:**

> App web para políticos que automatiza el monitoreo de su imagen pública: recopila la información del usuario en noticias y redes sociales, analiza tendencias y percepción, y a partir de ese diagnóstico propone estrategias concretas a seguir.

**Versión 2:**

> Inteligencia de reputación para políticos: monitorea su presencia en noticias y redes, detecta tendencias en su imagen pública y propone estrategias concretas a seguir.

### Subproyecto: Forme — MeLi BR (`varios/forme`)

**Original:**

> Demo / MVP para la presentación de un proyecto para ForMe. La plataforma hacía seguimiento de campañas mediante análisis de sentimiento en redes sociales. Se presentó a Mercado Libre Brasil; tras algunas reuniones y avances, se canceló.

**Versión 1:**

> Demo / MVP para la presentación de un proyecto para ForMe. La plataforma hacía seguimiento de campañas mediante análisis de sentimiento en redes sociales, midiendo la percepción del público para evaluar el impacto de cada campaña. Se presentó a Mercado Libre Brasil; tras algunas reuniones y avances, se canceló.

**Versión 2:**

> Seguimiento de campañas mediante análisis de sentimiento en redes sociales: una demo / MVP para ForMe que medía la percepción del público para evaluar el impacto de cada campaña. Se presentó a Mercado Libre Brasil; tras algunas reuniones y avances, se canceló.

---

## Estructura anterior

Hasta el 21/10/2026 el portafolio se organizaba en organizaciones/proyectos padre con subproyectos (rutas `/projects/<proyecto>` y `/projects/<proyecto>/<subproyecto>`). Se registra completa para no perder información (las descripciones de cada nivel están arriba).

### 1. Banner Director (`banner-director`)

- period: 2021 — 2026
- location: Córdoba, Argentina
- company: Banner Director
- cardDescription: Software de gestión y distribución de contenido digital para cartelería de forma centralizada.
- stack: Go, Vue, PostgreSQL, TypeScript, Kotlin, Docker, Next.js, Firebase, Kubernetes
- imágenes: 0
- **1. Banner 2.0** (`banner-director/banner-2`)
  - period: 2023 — 2026
  - url: https://v2.bannerdirector.com
  - stats: +600 equipos funcionando
  - stack: Go, Vue, PostgreSQL, TypeScript, Kotlin, Docker, Kubernetes
  - imágenes: 14 (`/images/proyects/banner-director/banner-2/`)
- **2. App Etiquetas** (`banner-director/app-etiquetas`)
  - period: 2025
  - stack: Flutter
  - imágenes: 2 (`/images/proyects/banner-director/app-etiquetas/`)
- **3. Web Landing** (`banner-director/web-landing`)
  - period: 2024
  - url: https://web.bannerdirector.com/
  - stack: Next.js, Firebase
  - imágenes: 1 (`/images/proyects/banner-director/web-landing/`)
- **4. Banner Teams** (`banner-director/teams`)
  - period: 2026
  - stack: NestJS, TypeScript, PostgreSQL, Prisma, Next.js
  - imágenes: 1 (`/images/proyects/banner-director/teams/`)

### 2. VIBO — Pádel Análisis (`vibo`)

- period: 2025 — 2026
- location: Londres, Inglaterra
- company: VIBO
- cardDescription: Análisis por video de partidos de pádel.
- active: sí
- stack: Python, GCP, Docker, Next.js, Firebase
- imágenes: 0
- **1. Pádel Video Análisis** (`vibo/padel-video-analisis`)
  - period: 2025 — 2026
  - url: https://vibopadel.com/
  - stack: Python, GCP, Docker
  - imágenes: 8 (`/images/proyects/vibo/padel-video-analisis/`)
- **2. Web Demo** (`vibo/web-demo`)
  - period: 2026
  - stack: Next.js
  - imágenes: 3 (`/images/proyects/vibo/web-demo/`)

### 3. Naturalis — Centro de estética (`naturalis`)

- period: 2024 — 2025
- location: Buenos Aires, Argentina
- company: Naturalis
- cardDescription: Sistema de gestión de turnos, tratamientos, empleados, blog y mailing de un centro de estética.
- stack: Next.js, Firebase
- imágenes: 0
- **1. Natuadmin** (`naturalis/natuadmin`)
  - period: 2024 — 2025
  - stats: +650 clientes registrados, +60 turnos por mes
  - stack: Node, Firebase, Next.js
  - imágenes: 8 (`/images/proyects/naturalis/natuadmin/`)
- **2. Web App** (`naturalis/web-app`)
  - period: 2024 — 2025
  - url: https://naturalis.vercel.app/
  - stack: Next.js
  - imágenes: 8 (`/images/proyects/naturalis/app-web/`)

### 4. AGNT (`agnt`)

- period: 2025 — 2026
- location: Córdoba, Argentina / Ciudad de México, México
- company: AGNT
- cardDescription: Plataforma para agencias de representantes de jugadores de fútbol.
- stack: TypeScript, Firebase
- imágenes: 4 (`/images/proyects/agnt/`)

### 5. Starbene — Medicina estética (`starbene`)

- period: 2023 — 2025
- location: Buenos Aires, Argentina
- company: Starbene
- cardDescription: App y sitio comercial para un proveedor de medicina estética: equipos, capacitación y servicios.
- stack: React Native, Next.js, Firebase
- imágenes: 0
- **1. App Mobile** (`starbene/app-mobile`)
  - period: 2023
  - alert: El proyecto se abandonó antes de salir a producción por cambios en las necesidades de la empresa.
  - stack: React Native
  - imágenes: 5 (`/images/proyects/starbene/app-mobile/`)
- **2. Web App** (`starbene/web-landing`)
  - period: 2023
  - url: https://www.starbene.com/
  - alert: Las imágenes son ilustrativas: la empresa cuenta hoy con su propio equipo de desarrollo y el sitio tuvo múltiples modificaciones.
  - stack: Next.js
  - imágenes: 3 (`/images/proyects/starbene/web-comercial/`)

### 6. Varios (`varios`)

- period: 2022 — 2026
- cardDescription: Proyectos varios, MVPs, demos y piezas puntuales.
- stack: TypeScript, Python, Supabase, Next.js, Firebase
- imágenes: 0
- **1. Venta Duplex** (`varios/venta-duplex`)
  - period: 2022
  - stack: React
  - imágenes: 5 (`/images/proyects/varios/venta-duplex/`)
- **2. Agro IA Tesis** (`varios/agro-ia-tesis`)
  - period: 2025
  - stack: Next.js
  - imágenes: 0
- **3. Arcor demo** (`varios/arcor-demo`)
  - period: 2023
  - stack: React
  - imágenes: 2 (`/images/proyects/varios/arcor-demo/`)
- **4. Cielo y Mar — Suites** (`varios/cielo-y-mar`)
  - period: 2023
  - url: https://www.suitescieloymar.com/
  - alert: Las imágenes son ilustrativas y corresponden a los primeros bocetos; el sitio tuvo múltiples modificaciones posteriores.
  - stack: Next.js, Firebase
  - imágenes: 1 (`/images/proyects/varios/cielo-y-mar/`)
- **5. Análisis de reputación política** (`varios/analisis-rep-politica`)
  - period: 2026
  - active: sí
  - stack: NestJS, Next.js, Supabase
  - imágenes: 0
- **6. Forme — MeLi BR** (`varios/forme`)
  - period: 2025
  - stack: Python, React
  - imágenes: 1 (`/images/proyects/varios/forme/`)

## Estructura nueva (lista plana)

Cada ítem es un proyecto individual (`/projects/<id>`), ordenado según la prioridad de `docs/descripcion-de-producto.md` (campo `tier`: 1 = primera línea, 2 = segunda, 3 = tercera). Pirp figura en la prioridad pero no está en la lista.

- Banner Director se dividió en Banner 2.0, App Etiquetas, Web Landing y Banner Teams; su descripción y datos de organización se conservan en el campo `organization` de cada uno (sección «Sobre Banner Director»).
- VIBO, Naturalis y Starbene se unificaron en un solo proyecto cada uno; sus antiguos subproyectos quedan como `parts` (sección «Qué incluye»), con sus textos, stack, urls, stats y notas. Las galerías se combinaron.
- Los subproyectos de Varios pasaron a ser proyectos individuales. El texto del grupo Varios (arriba) ya no se muestra en el sitio.
- Las rutas antiguas redirigen a las nuevas (`redirects` en `astro.config.ts`).

1. **VIBO — Pádel Análisis** (`vibo`, tier 1) — partes: Pádel Video Análisis, Web Demo
2. **Naturalis — Centro de estética** (`naturalis`, tier 1) — partes: Natuadmin, Web App
3. **Banner 2.0** (`banner-2`, tier 1) — Banner Director
4. **Starbene — Medicina estética** (`starbene`, tier 2) — partes: App Mobile, Web App
5. **AGNT** (`agnt`, tier 2)
6. **Cielo y Mar — Suites** (`cielo-y-mar`, tier 2)
7. **App Etiquetas** (`app-etiquetas`, tier 2) — Banner Director
8. **Web Landing** (`web-landing`, tier 2) — Banner Director
9. **Análisis de reputación política** (`analisis-rep-politica`, tier 2)
10. **Forme — MeLi BR** (`forme`, tier 3)
11. **Agro IA Tesis** (`agro-ia-tesis`, tier 3)
12. **Venta Duplex** (`venta-duplex`, tier 3)
13. **Arcor demo** (`arcor-demo`, tier 3)
14. **Banner Teams** (`teams`, tier 3) — Banner Director

Descripción unificada de Naturalis (nueva, combina el texto del proyecto con sus dos partes):

> Plataforma que digitaliza la gestión completa de un centro de estética, formada por dos piezas conectadas: Natuadmin, el panel desde el que el equipo administra turnos, tratamientos, horarios y comunicación, y una web app donde los clientes reservan y siguen su agenda online. Automatiza el trabajo repetitivo —turnos fijos, confirmaciones y cancelaciones por mail, estadísticas de cada cliente— para que el equipo se enfoque en atender y no en administrar.
