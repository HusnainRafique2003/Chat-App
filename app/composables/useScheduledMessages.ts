export interface ScheduledMessageJob {
  id: string
  channelId: string
  content: string
  scheduledAt: string
  createdAt: string
  workspaceId: string
  senderId: string
  senderName: string
  senderEmail: string
  channelName?: string
}

const STORAGE_KEY = 'chat-scheduled-messages'
let isProcessingScheduledMessages = false

function canUseStorage() {
  return process.client && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readScheduledJobs(): ScheduledMessageJob[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeScheduledJobs(jobs: ScheduledMessageJob[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
}

function createJobId() {
  if (process.client && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `scheduled-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function useScheduledMessages() {
  function enqueueScheduledMessage(input: Omit<ScheduledMessageJob, 'id'>) {
    const jobs = readScheduledJobs()
    const job: ScheduledMessageJob = {
      ...input,
      id: createJobId()
    }

    jobs.push(job)
    jobs.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    writeScheduledJobs(jobs)
    return job
  }

  function getScheduledMessages() {
    return readScheduledJobs()
  }

  function removeScheduledMessage(id: string) {
    const jobs = readScheduledJobs().filter(job => job.id !== id)
    writeScheduledJobs(jobs)
  }

  async function processDueScheduledMessages(
    sendNow: (job: ScheduledMessageJob) => Promise<boolean>
  ) {
    if (isProcessingScheduledMessages) return

    isProcessingScheduledMessages = true
    const jobs = readScheduledJobs()
    if (!jobs.length) {
      isProcessingScheduledMessages = false
      return
    }

    try {
      const now = Date.now()
      const remaining: ScheduledMessageJob[] = []

      for (const job of jobs) {
        const scheduledAtMs = new Date(job.scheduledAt).getTime()

        if (Number.isNaN(scheduledAtMs) || scheduledAtMs > now) {
          remaining.push(job)
          continue
        }

        const sent = await sendNow(job)
        if (!sent) {
          remaining.push(job)
        }
      }

      writeScheduledJobs(remaining)
    } finally {
      isProcessingScheduledMessages = false
    }
  }

  return {
    enqueueScheduledMessage,
    getScheduledMessages,
    removeScheduledMessage,
    processDueScheduledMessages
  }
}
