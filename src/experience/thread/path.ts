import type { QualityTier } from "@/experience/types"

/**
 * Forma compartida del hilo conductor para el spike T-A08 (ADR-006).
 *
 * Las dos opciones (A filamento, C enjambre) leen la misma curva, calculada en
 * GPU: así la comparación es solo de lenguaje visual y no de coreografía.
 *
 * - Vibo: trayectoria de la pelota con pique; la "pelota" es la punta del hilo.
 * - Pirp: la misma energía se acelera y se vuelve una señal con pulsos que
 *   viajan (`03-escenas.md` §3.2 beat 1 y §4).
 *
 * `uMix` (0 Vibo → 1 Pirp) mezcla las dos formas; `uPhase` es la fase
 * acumulada de los pulsos (se integra en CPU para que cambiar la velocidad no
 * produzca saltos).
 */

export type ThreadStyle = {
  line: string
  head: string
  background: string
}

export const THREAD_STYLES = {
  vibo: { line: "#3d8bff", head: "#f5c451", background: "#040a18" },
  // Acento Pirp = bordó de marca (ADR-006 / I-03); no nombrar al cliente.
  pirp: { line: "#7A1F2B", head: "#EFE9DD", background: "#17181A" },
} as const satisfies Record<"vibo" | "pirp", ThreadStyle>

export type RenderTier = Exclude<QualityTier, "static">

/** Segmentos del listón del filamento (opción A). 2 triángulos por segmento. */
export const FILAMENT_SEGMENTS: Record<RenderTier, number> = {
  high: 360,
  medium: 240,
  low: 140,
}

/** Partículas del enjambre (opción C). Un solo draw call con `Points`. */
export const SWARM_PARTICLES: Record<RenderTier, number> = {
  high: 24_000,
  medium: 12_000,
  low: 5_000,
}

/** Medidas del hilo en unidades de mundo según el viewport (z = 0). */
export type ThreadExtent = {
  x: number
  y: number
  /** 1 en un viewport de referencia horizontal; escala grosores y tamaños. */
  scale: number
  portrait: boolean
  /** En vertical el hilo sube: la escena va arriba y el texto abajo (`02` §4). */
  offsetY: number
}

const REFERENCE_HEIGHT = 4.14

export function threadExtent(width: number, height: number): ThreadExtent {
  const portrait = width < height

  // En vertical la curva ocupa casi todo el ancho y no crece más de lo que
  // permite el ancho: la trayectoria no se vuelve una aguja.
  const x = width * (portrait ? 0.41 : 0.4)
  const y = portrait ? Math.min(height * 0.24, x * 1.2) : height * 0.26

  return {
    x,
    y,
    scale: Math.min(width, height) / REFERENCE_HEIGHT,
    portrait,
    offsetY: portrait ? height * 0.1 : 0,
  }
}

export const THREAD_PATH_GLSL = /* glsl */ `
uniform float uPhase;
uniform vec2 uExtent;
uniform float uUsePath;
uniform vec3 uPath[32];

const float THREAD_PI = 3.141592653589793;
const int PULSES = 3;

float pulseCenter(int i) {
  return fract(uPhase + float(i) / float(PULSES));
}

// En Vibo solo existe la pelota (pulso 0); los otros aparecen hacia Pirp.
// Los bordes se desvanecen para que el salto de 1 a 0 no se vea.
float pulseWeight(int i, float m) {
  float c = pulseCenter(i);
  float edges = smoothstep(0.0, 0.06, c) * smoothstep(1.0, 0.94, c);
  return (i == 0 ? 1.0 : smoothstep(0.35, 0.9, m)) * edges;
}

vec3 viboPath(float u) {
  float x = mix(-1.0, 1.0, u);
  float y;

  if (u < 0.64) {
    // Golpe: arco alto que pica en u = 0.64.
    float d = u - 0.3;
    y = -14.27 * d * d + 0.85;
  } else {
    // Pique: arco corto hacia el fondo de la cancha.
    float d = (u - 0.82) / 0.18;
    y = -0.8 + 0.55 * (1.0 - d * d);
  }

  return vec3(x, y, (0.5 - u) * 0.9);
}

vec3 pirpPath(float u, float m) {
  float x = mix(-1.0, 1.0, u);
  float y = 0.0;

  for (int i = 0; i < PULSES; i++) {
    float d = (u - pulseCenter(i)) * 32.0;
    float e = d - 1.7;
    y += pulseWeight(i, m) * (exp(-d * d) * 1.05 - exp(-e * e) * 0.4);
  }

  // Portadora: el ruido de fondo del tiempo real.
  y += sin(u * 46.0 - uPhase * 40.0) * 0.03;

  return vec3(x, y * 0.7, 0.0);
}

vec3 threadPath(float u, float m) {
  vec3 result = vec3(0.0);
  if (uUsePath > 0.5) {
    float index = clamp(u, 0.0, 1.0) * 31.0;
    int a = min(int(floor(index)), 30);
    result = mix(uPath[a], uPath[a + 1], index - float(a));
  } else {
    vec3 p = mix(viboPath(u), pirpPath(u, m), m);
    result = vec3(p.x * uExtent.x, p.y * uExtent.y, p.z);
  }
  return result;
}

// Energía a lo largo del hilo: cola de cometa detrás de cada pulso.
// En Vibo la cola es larga (la pelota deja estela); en Pirp, pulsos secos.
float threadEnergy(float u, float m) {
  float energy = 0.0;
  float tail = mix(0.22, 0.05, m);

  for (int i = 0; i < PULSES; i++) {
    float c = pulseCenter(i);
    float behind = c - u;
    float front = behind / 0.012;
    float shape = behind >= 0.0 ? exp(-behind / tail) : exp(-front * front);
    float wrappedBehind = behind + 1.0;
    float wrappedShape =
      exp(-wrappedBehind / tail) * (1.0 - smoothstep(0.0, 0.35, c));
    float modeWeight = i == 0 ? 1.0 : smoothstep(0.35, 0.9, m);
    energy += modeWeight * max(shape, wrappedShape);
  }

  return energy;
}
`
