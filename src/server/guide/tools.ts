import { tool } from "ai"
import { z } from "zod"
import { scenes } from "../../scenes/registry"

export function guideTools(projectIds: string[]) {
  const chapters = [
    "hero",
    "manifesto",
    "archive",
    "about",
    "contact",
    ...scenes.map((s) => s.chapterId),
  ]
  return {
    goToChapter: tool({
      description: "Ir a un capítulo del recorrido",
      inputSchema: z
        .object({ chapterId: z.enum(chapters as [string, ...string[]]) })
        .strict(),
    }),
    goToBeat: tool({
      description: "Ir a un beat registrado de una escena",
      inputSchema: z
        .object({ sceneId: z.string(), beatId: z.string() })
        .strict()
        .refine(
          (v) =>
            scenes.some(
              (s) =>
                s.id === v.sceneId && s.beats.some((b) => b.id === v.beatId)
            ),
          "Beat inexistente"
        ),
    }),
    // No scene currently publishes highlight target ids. Never invent a target.
    highlight: tool({
      description:
        "Resaltar un objetivo registrado (actualmente no hay objetivos habilitados)",
      inputSchema: z
        .object({
          target: z.string().refine(() => false, "Sin objetivos registrados"),
        })
        .strict(),
    }),
    openProject: tool({
      description: "Abrir un caso del portafolio",
      inputSchema: z
        .object({ id: z.enum(projectIds as [string, ...string[]]) })
        .strict(),
    }),
    showContact: tool({
      description: "Mostrar el contacto de Gonzalo",
      inputSchema: z.object({}).strict(),
    }),
  }
}
