export function formatDateTimeID(iso?: string | null): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDateShortID(iso?: string | null): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function formatEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ppe_violation: 'Pelanggaran APD',
    fall: 'Insiden Jatuh',
    fall_detected: 'Insiden Jatuh',
    no_helmet: 'Tanpa Helm',
    no_vest: 'Tanpa Rompi',
    no_gloves: 'Tanpa Sarung Tangan',
    no_boots: 'Tanpa Sepatu Safety',
  }
  return map[type] || type.replace(/_/g, ' ')
}

export function formatVerificationLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Menunggu',
    verified: 'Benar',
    dismissed: 'False Alarm',
  }
  return map[status] || status
}

export function formatSopStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    indexed: 'Indexed',
    failed: 'Failed',
  }
  return map[status] || status
}
