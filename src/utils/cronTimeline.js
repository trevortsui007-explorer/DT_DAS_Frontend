import * as cronParser from 'cron-parser'

const DAY_MINUTES = 24 * 60
const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_MINUTES = 240
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000
const MAX_ITERATIONS = 6000
const MAX_POINTS = 1200

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.toJSDate === 'function') return value.toJSDate()

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatTime = (dateLike) => {
  const date = toDate(dateLike)
  if (!date) return ''

  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const normalizeCronExpression = (raw) => {
  const value = String(raw || '').trim()
  if (!value || value === '-' || value.toLowerCase() === 'null') return ''
  return value
}

const normalizeToSixPartCron = (expression) => {
  const parts = String(expression || '').trim().split(/\s+/)
  if (parts.length === 5) return `0 ${expression}`
  if (parts.length === 6) return expression
  return ''
}

const getParseFn = () => {
  if (typeof cronParser.parseExpression === 'function') return cronParser.parseExpression
  if (cronParser.CronExpressionParser?.parse) return cronParser.CronExpressionParser.parse
  throw new Error('cron-parser parse function is not available')
}

const parseExpressionSafe = (expression, currentDate) => {
  try {
    const normalized = normalizeToSixPartCron(expression)
    if (!normalized) return null

    const parse = getParseFn()
    return parse(normalized, { currentDate })
  } catch {
    return null
  }
}

const collectWindowPoints = (expression, startMs, endMs) => {
  const iterator = parseExpressionSafe(expression, new Date(startMs - 1000))
  if (!iterator) return { parseError: true, timestamps: [] }

  const timestamps = []
  let iterations = 0

  while (iterations < MAX_ITERATIONS && timestamps.length < MAX_POINTS) {
    iterations += 1

    let nextValue = null
    try {
      nextValue = iterator.next()
    } catch {
      break
    }

    const date = toDate(nextValue)
    if (!date) break

    const timestamp = date.getTime()
    if (timestamp >= endMs) break
    if (timestamp >= startMs) timestamps.push(timestamp)
  }

  return { parseError: false, timestamps }
}

const getNextRunAfter = (expression, currentDate) => {
  const iterator = parseExpressionSafe(expression, currentDate)
  if (!iterator) return null

  try {
    return toDate(iterator.next())
  } catch {
    return null
  }
}

const toRollingPercent = (timestamp, startMs, endMs) => {
  if (!Number.isFinite(timestamp) || endMs <= startMs) return 0
  const ratio = (timestamp - startMs) / (endMs - startMs)
  return clamp(ratio * 100, 0, 100)
}

const toDayPercent = (timestamp, dayStartMs) => {
  if (!Number.isFinite(timestamp)) return 0
  const diffMs = timestamp - dayStartMs
  return clamp((diffMs / DAY_MS) * 100, 0, 100)
}

const normalizeTask = (task) => ({
  id: task.id ?? task.Id,
  taskName: task.taskName || task.TaskName || `Task ${task.id ?? task.Id ?? ''}`.trim(),
  isEnabled: task.isEnabled ?? task.IsEnabled ?? false,
  cronExpression: normalizeCronExpression(task.cronExpression || task.CronExpression),
})

export const getDayProgressPercent = (date = new Date()) => {
  const current = toDate(date) || new Date()
  const minute = current.getHours() * 60 + current.getMinutes()
  return clamp((minute / DAY_MINUTES) * 100, 0, 100)
}

export const buildCronTimelineItems = (tasks, now = new Date()) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return []

  const current = toDate(now) || new Date()
  const nowTs = current.getTime()
  const dayStartMs = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
    0,
    0,
    0,
    0,
  ).getTime()
  const dayEndMs = dayStartMs + DAY_MS
  const windowStart = nowTs - WINDOW_MS
  const windowEnd = nowTs + WINDOW_MS

  return tasks
    .map(normalizeTask)
    .filter((task) => task.cronExpression)
    .map((task) => {
      const dayPointsResult = collectWindowPoints(task.cronExpression, dayStartMs, dayEndMs)
      const rollingResult = collectWindowPoints(task.cronExpression, windowStart, windowEnd)
      const parseError = dayPointsResult.parseError || rollingResult.parseError

      const dayTimestamps = dayPointsResult.timestamps
      const rollingTimestamps = rollingResult.timestamps

      const firstFutureInDay = dayTimestamps.find((timestamp) => timestamp > nowTs)
      const firstFutureInWindow = rollingTimestamps.find((timestamp) => timestamp > nowTs)

      const timelinePoints = dayTimestamps.map((timestamp) => ({
        timestamp,
        time: formatTime(timestamp),
        pos: toDayPercent(timestamp, dayStartMs),
        kind:
          timestamp === firstFutureInDay
            ? 'next'
            : timestamp <= nowTs
              ? 'past'
              : 'future',
      }))

      const rollingPoints = rollingTimestamps.map((timestamp) => {
        const isHistory = timestamp <= nowTs
        const kind =
          timestamp === firstFutureInWindow
            ? 'next'
            : isHistory
              ? 'past'
              : 'future'

        return {
          timestamp,
          time: formatTime(timestamp),
          pos: toRollingPercent(timestamp, windowStart, windowEnd),
          type: isHistory ? 'history' : 'prediction',
          kind,
          status: undefined,
          isNext: kind === 'next',
        }
      })

      const pastPoints = timelinePoints.filter((point) => point.kind === 'past').slice(-2)
      const nextPoint = timelinePoints.find((point) => point.kind === 'next') || null

      let nextRunOutsideWindow = null
      if (!nextPoint && !parseError) {
        const nextDate = getNextRunAfter(task.cronExpression, new Date(dayEndMs))
        if (nextDate) {
          nextRunOutsideWindow = {
            timestamp: nextDate.getTime(),
            time: formatTime(nextDate),
          }
        }
      }

      return {
        ...task,
        rollingPoints,
        windowStart,
        windowEnd,
        nowPos: 50,
        timelinePoints,
        pastPoints,
        nextPoint,
        nextRunOutsideWindow,
        parseError,
      }
    })
}
