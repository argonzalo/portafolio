import { useEffect, useLayoutEffect, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { MathUtils, type Texture } from "three"
import type { QualityTier } from "@/experience/types"
import {
  applyEnvMap,
  attachRacket,
  buildRacket,
  buildRig,
  disposeRig,
  measureContact,
  playerUrls,
  poseRig,
  type ContactProbe,
  type PlayerJoints,
  type RimUniforms,
} from "./rig"
import { HERO_POSITION, HERO_YAW } from "./world"

type Props = {
  quality: QualityTier
  envMap: Texture | null
  /** Instante del golpe 0..1, escrito por la escena antes de este frame. */
  swing: { current: number }
  joints: PlayerJoints
  rim: RimUniforms
  contact: ContactProbe
}

export function ViboPlayer({ quality, envMap, swing, joints, rim, contact }: Props) {
  const urls = playerUrls(quality)
  const [player, paddle] = useGLTF(urls, false, true)

  const rig = useMemo(
    () => buildRig(player.scene, player.animations, rim),
    [player, rim]
  )
  const racket = useMemo(() => buildRacket(paddle.scene), [paddle])

  useLayoutEffect(() => applyEnvMap(rig, racket, envMap), [envMap, rig, racket])
  useLayoutEffect(() => attachRacket(rig, racket), [rig, racket])

  useEffect(
    () => () => {
      disposeRig(rig, racket)
      useGLTF.clear(urls)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rig, racket]
  )

  useFrame(() => {
    if (!contact.ready) measureContact(rig, racket, joints, contact)
    poseRig(rig, racket, MathUtils.clamp(swing.current, 0, 1), joints)
  }, -1)

  return (
    <group position={HERO_POSITION} rotation-y={HERO_YAW}>
      <primitive object={rig.scene} />
    </group>
  )
}
