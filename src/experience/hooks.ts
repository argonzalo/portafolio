import { useSyncExternalStore } from "react"

import {
  experienceStore,
  type ExperienceSnapshot,
  type ExperienceStore,
} from "@/experience/store"

/** Suscripción React al estado discreto del store (nunca al progress por frame). */
export function useExperienceStore(
  store: ExperienceStore = experienceStore
): ExperienceSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
