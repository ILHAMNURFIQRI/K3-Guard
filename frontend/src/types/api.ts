export type UserRole = 'officer' | 'student'

export interface User {
  id: number
  nama: string
  email: string
  role: UserRole
  created_at?: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface AreaRule {
  id: number
  attribute: string
  required: boolean
}

export interface Area {
  id: number
  nama: string
  deskripsi?: string | null
  rules: AreaRule[]
}

export interface AreaCreate {
  nama: string
  deskripsi?: string
}

export interface AreaRuleUpdate {
  attribute: string
  required: boolean
}

export interface EventMedia {
  id: number
  file_path: string
  created_at?: string | null
}

export type VerificationStatus = 'pending' | 'verified' | 'dismissed'

export interface EventItem {
  id: number
  type: string
  area_id?: number | null
  camera_id?: number | null
  track_id?: string | null
  detail: string
  confidence: number
  created_at?: string | null
  verification: VerificationStatus | string
}

export interface EventDetail extends EventItem {
  verified_by?: number | null
  verified_at?: string | null
  follow_up_note: string
  media: EventMedia[]
}

export interface VerifyRequest {
  verification: 'verified' | 'dismissed'
}

export interface NoteRequest {
  follow_up_note: string
}

export type SOPIndexStatus = 'pending' | 'processing' | 'indexed' | 'failed'

export interface SOPDocument {
  id: number
  nama_file: string
  versi: string
  uploaded_by: number
  uploaded_at?: string | null
  status_index: SOPIndexStatus | string
}

export interface ChatRequest {
  session_id: string
  pertanyaan: string
}

export interface ChatResponse {
  jawaban: string
  sumber: string
  session_id: string
}

export interface UnansweredItem {
  id: number
  pertanyaan: string
  created_at?: string | null
  session_id?: string
  user_id?: number | null
  answered?: boolean
}

export interface UnansweredResponse {
  items: UnansweredItem[]
  total: number
}

export interface ThresholdSettings {
  confidence_threshold: number
  fall_sensitivity: number
  notification_cooldown_seconds: number
  max_concurrent_streams: number
  telegram_bot_token?: string
  telegram_chat_id?: string
  telegram_configured?: boolean
}

export interface StatsResponse {
  total_events: number
  pending_events: number
  verified_events: number
  dismissed_events: number
  events_by_type: Record<string, number>
  events_today: number
  active_cameras: number
  total_areas: number
}

export interface CameraStatus {
  id: number
  nama: string
  area_id: number | null
  source: string
  aktif: boolean
}

export interface PersonTrackStatus {
  track_id: string
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNVERIFIED' | 'DANGER'
  detail?: string
  /** Status per perlengkapan; kosong saat orang terbaring (tidak dinilai). */
  attributes?: Partial<
    Record<'head' | 'body' | 'legs' | 'feet', 'OK' | 'VIOLATION' | 'UNVERIFIED'>
  >
}

export interface MonitoringStatus {
  yolo_model: 'ready' | 'not_configured' | string
  total_cameras: number
  active_cameras: number
  cameras: CameraStatus[]
  person_statuses?: PersonTrackStatus[]
}
