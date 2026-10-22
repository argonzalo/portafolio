/**
 * Kit reutilizable de escena (`03-escenas.md` §2 · T-A18 + T-A19).
 */

export {
  PHONE_SPEC,
  LAPTOP_SPEC,
  DISPLAY_SPEC,
  DEVICE_FINISHES,
  DEVICE_FINISH_IDS,
  resolveScalar,
  toRenderTier,
  useScreenTexture,
  computeFitTransform,
  getTextureAspect,
  isVideoSource,
  DeviceScreen,
  layoutLayerRect,
  useStudioEnvironment,
  useDeviceMaterials,
  Phone,
  PHONE_SCREEN,
  Laptop,
  LAPTOP_SCREEN,
  Display,
  getDisplayScreenSize,
  DeviceShowcase,
  type DynamicScalar,
  type RenderTier,
  type DeviceFinish,
  type DeviceFinishSpec,
  type ScreenFit,
  type ScreenAlign,
  type UvTransform,
  type DeviceLayer,
  type DeviceScreenContent,
  type DeviceMaterials,
  type DeviceMaterialOptions,
  type PhoneProps,
  type DeviceBaseProps,
  type LaptopProps,
  type DisplayProps,
  type DeviceShowcaseProps,
} from "./devices"

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
