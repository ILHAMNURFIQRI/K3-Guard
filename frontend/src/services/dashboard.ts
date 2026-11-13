import { api } from './api'
import type {
  Area,
  AreaCreate,
  AreaRule,
  AreaRuleUpdate,
  ChatRequest,
  ChatResponse,
  EventDetail,
  EventItem,
  MonitoringStatus,
  SOPDocument,
  StatsResponse,
  ThresholdSettings,
  UnansweredResponse,
  VerifyRequest,
} from '@/types/api'

export interface EventFilterParams {
  page?: number
  size?: number
  type?: string
  verification?: string
  area_id?: number
}

export async function getMonitoringStatus(): Promise<MonitoringStatus> {
  const { data } = await api.get<MonitoringStatus>('/status')
  return data
}

export async function startCameraStream(
  cameraId: number
): Promise<{ status: string; detail?: string }> {
  const { data } = await api.post(`/monitoring/stream/${cameraId}/start`)
  return data
}

export async function stopCameraStream(
  cameraId: number
): Promise<{ status: string }> {
  const { data } = await api.post(`/monitoring/stream/${cameraId}/stop`)
  return data
}

export async function getStats(): Promise<StatsResponse> {
  const { data } = await api.get<StatsResponse>('/stats')
  return data
}

export async function getEvents(
  params: EventFilterParams = {}
): Promise<EventItem[]> {
  const cleanParams: Record<string, string | number> = {}
  if (params.page) cleanParams.page = params.page
  if (params.size) cleanParams.size = params.size
  if (params.type) cleanParams.type = params.type
  if (params.verification) cleanParams.verification = params.verification
  if (params.area_id) cleanParams.area_id = params.area_id

  const { data } = await api.get<EventItem[]>('/events', {
    params: cleanParams,
  })
  return data
}

export async function getEventDetail(eventId: number): Promise<EventDetail> {
  const { data } = await api.get<EventDetail>(`/events/${eventId}`)
  return data
}

export async function verifyEvent(
  eventId: number,
  verification: VerifyRequest['verification']
): Promise<EventDetail> {
  const { data } = await api.patch<EventDetail>(`/events/${eventId}/verify`, {
    verification,
  })
  return data
}

export async function addEventNote(
  eventId: number,
  followUpNote: string
): Promise<EventDetail> {
  const { data } = await api.patch<EventDetail>(`/events/${eventId}/note`, {
    follow_up_note: followUpNote,
  })
  return data
}

export async function getAreas(): Promise<Area[]> {
  const { data } = await api.get<Area[]>('/areas')
  return data
}

export async function createArea(payload: AreaCreate): Promise<Area> {
  const { data } = await api.post<Area>('/areas', payload)
  return data
}

export async function updateAreaRules(
  areaId: number,
  rules: AreaRuleUpdate[]
): Promise<AreaRule[]> {
  const { data } = await api.put<AreaRule[]>(`/areas/${areaId}/rules`, rules)
  return data
}

export async function getSopDocuments(): Promise<SOPDocument[]> {
  const { data } = await api.get<SOPDocument[]>('/sop')
  return data
}

export async function uploadSopDocument(
  file: File,
  versi = '1.0'
): Promise<SOPDocument> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<SOPDocument>('/sop', formData, {
    params: { versi },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updateSopDocument(
  sopId: number,
  file: File,
  versi = ''
): Promise<SOPDocument> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.put<SOPDocument>(`/sop/${sopId}`, formData, {
    params: { versi },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function downloadSopDocument(
  sopId: number,
  filename: string
): Promise<void> {
  const response = await api.get(`/sop/${sopId}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function deleteSopDocument(sopId: number): Promise<void> {
  await api.delete(`/sop/${sopId}`)
}

export async function sendChatMessage(
  payload: ChatRequest
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/chat', payload, { timeout: 120000 })  // model lokal bisa lambat
  return data
}

export async function getUnansweredQuestions(): Promise<UnansweredResponse> {
  const { data } = await api.get<UnansweredResponse>('/chat/unanswered')
  return data
}

export async function getThresholdSettings(): Promise<ThresholdSettings> {
  const { data } = await api.get<ThresholdSettings>('/settings/thresholds')
  return data
}

export async function updateThresholdSettings(
  payload: ThresholdSettings
): Promise<ThresholdSettings> {
  const { data } = await api.put<ThresholdSettings>(
    '/settings/thresholds',
    payload
  )
  return data
}
