# Portfolio — Technical & Creative Direction

## 1. Purpose

Portfolio personal de desarrollador orientado a mostrar:

- Proyectos reales y relevantes.
- Capacidad técnica y criterio de arquitectura.
- Experiencia construyendo interfaces y productos.
- Conocimientos de frontend, backend, sistemas y herramientas.
- Capacidad para crear experiencias visuales e interactivas.

El portfolio no será únicamente una colección de proyectos. El propio sitio funcionará como una demostración de las capacidades técnicas y creativas del desarrollador.

---

## 2. Stack

### Core

- **Astro** — framework principal y generación de páginas.
- **TypeScript** — lenguaje principal.
- **Tailwind CSS v4** — styling y sistema visual.
- **MDX** — contenido y case studies de proyectos.

### UI

- **shadcn/ui** — componentes funcionales y estructurados.
- Preset: ´--preset b5xKjAXTu´
- Luego de instalar, reemplazar tipografía por: "Poppins"
- Componentes propios cuando el diseño o la experiencia requieran mayor libertad.

shadcn/ui se utilizará como infraestructura, no como identidad visual del sitio.

### Motion & Interaction

- **GSAP** — animaciones, timelines, scroll animations y transiciones complejas.
- **View Transitions** — transiciones entre páginas y estados.
- **Three.js** — experiencias 3D, escenas interactivas y secciones experimentales.

## 3. Principio de diseño

El portfolio tendrá **dos lenguajes de interfaz complementarios**.

### A. Structured / Information First

Vistas orientadas a comunicar información de forma clara.

Características:

- Mayor predominancia de **shadcn/ui**.
- Layouts ordenados y consistentes.
- Tipografía y jerarquía visual claras.
- Animaciones sutiles y funcionales.
- GSAP utilizado para mejorar la experiencia, no para distraer.
- Tailwind utilizado principalmente para composición y personalización.
- Priorización de legibilidad, navegación y velocidad.

Ejemplos:

- About.
- Projects.
- Skills.
- Experience.
- Case studies.
- Contact.

Objetivo:

> La interfaz debe desaparecer y permitir que la información sea protagonista.

---

### B. Experimental / Creative

Secciones orientadas al impacto visual y a demostrar capacidad técnica.

Características:

- Mayor predominancia de **Three.js** y WebGL.
- GSAP para experiencias y secuencias complejas.
- Uso creativo y experimental de Tailwind y CSS.
- Componentes propios en lugar de componentes de librerías cuando sea necesario.
- Interacciones no convencionales.
- Motion más expresivo.
- Libertad artística en composición, navegación, profundidad y comportamiento.

Ejemplos:

- Hero principal.
- Experiencias asociadas a determinados proyectos.
- Visualizaciones de arquitectura.
- Experimentos interactivos.
- Transiciones especiales.
- Secciones conceptuales.

Objetivo:

> La interfaz debe convertirse en parte del contenido y demostrar lo que el desarrollador es capaz de construir.

---

## 4. Regla principal

No todas las páginas necesitan ser espectaculares.

El portfolio combinará:

**Claridad → Información → Interacción → Experimentación**

La creatividad se utilizará estratégicamente.

Una página de contenido no debe convertirse en una experiencia 3D simplemente porque sea técnicamente posible.

Del mismo modo, las secciones creativas tendrán libertad suficiente para romper las reglas del sistema visual cuando eso aporte valor.

---

## 5. Identidad visual

La identidad será propia y no dependerá de un template de componentes.

### shadcn/ui

Se utilizará para:

- Buttons.
- Dialogs.
- Sheets.
- Tooltips.
- Tabs.
- Accordion.
- Navigation.
- Inputs.
- Otros componentes funcionales.

Los componentes podrán modificarse completamente mediante Tailwind y CSS.

### Tailwind / CSS

Se utilizarán para construir:

- Layouts.
- Tipografía.
- Grid.
- Espaciado.
- Responsive design.
- Composiciones especiales.
- Efectos visuales.
- Componentes propios.

Se priorizarán CSS variables y tokens de diseño para mantener consistencia sin limitar la creatividad.

### GSAP

Responsable de:

- Entradas y salidas.
- Scroll-driven animations.
- Timelines.
- Microinteracciones.
- Transiciones.
- Animaciones coordinadas con Three.js.

### Three.js

Responsable de:

- Escenas 3D.
- Visualizaciones.
- Experiencias interactivas.
- Elementos generativos.
- Experimentos visuales.

Three.js no se utilizará como decoración gratuita.

---

## 6. Arquitectura del proyecto

```text
portfolio/
├── public/
│   ├── images/
│   ├── models/
│   └── fonts/
│
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui
│   │   ├── layout/          # estructura general
│   │   ├── portfolio/       # componentes propios
│   │   └── interactive/     # GSAP / Three.js
│   │
│   ├── content/
│   │   └── projects/        # proyectos en MDX
│   │
│   ├── layouts/
│   │
│   ├── pages/
│   │
│   ├── lib/
│   │
│   └── styles/
│       ├── globals.css
│       └── animations.css
│
├── astro.config.ts
├── components.json
├── package.json
└── tsconfig.json
```

### Separación de responsabilidades

- `components/ui/` → componentes de shadcn.
- `components/layout/` → estructura global.
- `components/portfolio/` → componentes visuales propios.
- `components/interactive/` → experiencias GSAP / Three.js.
- `content/projects/` → contenido de proyectos.
- `styles/` → tokens, variables y estilos globales.
- `lib/` → utilidades y lógica reutilizable.

---

## 7. Proyectos / Case Studies

Cada proyecto deberá explicar tanto el resultado como el proceso.

Estructura conceptual:

```text
Project
├── Overview
├── Problem
├── Context
├── Solution
├── Architecture
├── Implementation
├── Technical decisions
├── Challenges
├── Result
└── Lessons learned
```

El objetivo no es solamente demostrar que una tecnología fue utilizada.

Debe quedar claro:

- Qué problema se resolvió.
- Por qué se tomaron determinadas decisiones.
- Qué complejidad existía.
- Cómo se construyó la solución.
- Qué conocimientos demuestra el proyecto.

---

## 8. Performance

El impacto visual nunca debe justificar una mala experiencia.

Prioridades:

1. Performance.
2. Accesibilidad.
3. Usabilidad.
4. SEO.
5. Experiencia visual.

Las experiencias pesadas deberán:

- Cargarse progresivamente.
- Evitar bloquear el contenido principal.
- Utilizar lazy loading cuando corresponda.
- Tener fallback cuando WebGL no esté disponible.
- Reducir o desactivar movimiento cuando el usuario prefiera `prefers-reduced-motion`.

---

## 9. Filosofía técnica

El proyecto seguirá una filosofía de **simplicidad + control**.

No se agregará una librería para cada necesidad.

Antes de incorporar una dependencia se evaluará:

- ¿Realmente aporta valor?
- ¿Puede resolverse con Astro, TypeScript, CSS o Web APIs?
- ¿Afecta el bundle?
- ¿Aumenta innecesariamente la complejidad?
- ¿Nos limita visualmente?

La tecnología debe servir al concepto del portfolio, no al revés.

---

## 10. Resultado buscado

El portfolio debe conseguir dos cosas simultáneamente:

### En pocos segundos

Comunicar claramente:

> **Quién soy, qué construyo y qué tecnologías domino.**

### Después de explorar

Comunicar:

> **Cómo pienso, cómo resuelvo problemas y hasta dónde puedo llevar una experiencia web.**

Por eso el sitio combinará **estructura y libertad**:

```text
STRUCTURED
    ↓
Information
    ↓
UI
    ↓
Interaction
    ↓
Motion
    ↓
CREATIVE
    ↓
Three.js
    ↓
Experimentation
```

El portfolio debe sentirse como un producto cuidadosamente diseñado, pero también como un espacio donde se pueda experimentar.
