import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function displayUrl(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname}`.replace(/\/$/, "")
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
  }
}
