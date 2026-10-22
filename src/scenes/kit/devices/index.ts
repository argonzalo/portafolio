/**
 * Kit de dispositivos 3D (`src/scenes/kit/devices/` · T-A19).
 *
 * Modelos low-poly procedurales con proporciones físicas reales (1 unidad = 10 cm),
 * materiales metálicos/vidrio con mapa de entorno de estudio compartido,
 * pantallas texturizables (`.webp`/`.png`/`.mp4` o `Texture` propia) y
 * capas de UI que se despegan y flotan en 3D con paralaje sutil.
 */

export {
  PHONE_SPEC,
  LAPTOP_SPEC,
  DISPLAY_SPEC,
  PHONE_SCREEN,
  LAPTOP_SCREEN,
  getDisplayScreenSize,
  DEVICE_FINISHES,
  DEVICE_FINISH_IDS,
  resolveScalar,
  toRenderTier,
  type DynamicScalar,
  type RenderTier,
  type DeviceFinish,
  type DeviceFinishSpec,
} from "./specs"

export {
  useScreenTexture,
  computeFitTransform,
  getTextureAspect,
  isVideoSource,
  layoutLayerRect,
  type ScreenFit,
  type ScreenAlign,
  type UvTransform,
} from "./screenTexture"

export {
  DeviceScreen,
  type DeviceLayer,
  type DeviceScreenContent,
} from "./DeviceScreen"

export {
  useStudioEnvironment,
  useDeviceMaterials,
  type DeviceMaterials,
  type DeviceMaterialOptions,
} from "./materials"

export { Phone, type PhoneProps, type DeviceBaseProps } from "./Phone"

export { Laptop, type LaptopProps } from "./Laptop"

export { Display, type DisplayProps } from "./Display"

export { DeviceShowcase, type DeviceShowcaseProps } from "./DeviceShowcase"
