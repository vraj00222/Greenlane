import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 40) return 'text-amber-500'
  return 'text-red-500'
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500/10'
  if (score >= 40) return 'bg-amber-500/10'
  return 'bg-red-500/10'
}

export function getScoreGradient(score: number): string {
  if (score >= 70) return 'from-emerald-500 to-green-400'
  if (score >= 40) return 'from-amber-500 to-yellow-400'
  return 'from-red-500 to-orange-400'
}
