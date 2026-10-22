/**
 * Kit reutilizable de escena (`03-escenas.md` §2 · T-A18).
 *
 * Nota: los dispositivos 3D (`Phone`, `Laptop`, `Display`) viven en
 * `src/scenes/kit/devices/` y corresponden a la tarea T-A19.
 */

export {
  KIT_THEMES,
  KIT_LAB_BEATS,
  getKitTheme,
  type KitPresetId,
  type KitTheme,
} from "./theme"

export {
  phase,
  smootherPhase,
  beatEnvelope,
  KIT_LINE_SAMPLES,
  resampleCurvePoints,
  formatKitNumber,
  buildTrendSvgGeometry,
  interpolateCameraState,
  useBeatCameraRig,
  type Vec3Tuple,
  type BeatCameraFrame,
  type BeatCameraRigOptions,
  type InterpolatedCameraState,
} from "./cameraRig"

export { KitHtml, type KitHtmlProps } from "./KitHtml"

export { ThreadLine, type ThreadLineProps } from "./ThreadLine"

export {
  HudOverlay,
  type DynamicVec3,
  type HudMarkerItem,
  type HudBoundingBox3D,
  type HudJoint3D,
  type HudAngleGauge3D,
  type HudPoseSkeleton3D,
  type HudOverlayProps,
} from "./HudOverlay"

export {
  AgentGraph,
  type AgentNodeDef,
  type AgentEdgeDef,
  type AgentGraphProps,
} from "./AgentGraph"

export {
  TelemetryDeck,
  type KitCounterDef,
  type KitBarDef,
  type KitTrendSeries,
  type TelemetryDeckProps,
} from "./CountersAndCharts"

export { ParticleField, type ParticleFieldProps } from "./ParticleField"

export {
  default as KitShowcaseScene,
  type KitShowcaseSceneProps,
} from "./KitShowcaseScene"

export { KitLab } from "./KitLab"
