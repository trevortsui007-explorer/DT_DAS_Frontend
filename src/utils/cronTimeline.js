import * as cronParser from 'cron-parser'

const MINUTES_PER_DAY = 24 * 60

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.toJSDate === 'function') return value.toJSDate()

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatTime = (date) => {
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const getMinuteOfDay = (date) => date.getHours() * 60 + date.getMinutes()

const toPercent = (date) => {
  const minute = getMinuteOfDay(date)
  return clamp((minute / MINUTES_PER_DAY) * 100, 0, 100)
}

const normalizeCronExpression = (raw) => {
  const value = String(raw || '').trim()
  if (!value || value === '-' || value.toLowerCase() === 'null') return ''
  return value
}

const getParseFn = () => {
  if (typeof cronParser.parseExpression === 'function') {
    return cronParser.parseExpression
  }

  if (cronParser.CronExpressionParser?.parse) {
    return cronParser.CronExpressionParser.parse
  }

  throw new Error('cron-parser parse function is not available')
}

const parseExpressionSafe = (expression, currentDate) => {
  try {
    const parse = getParseFn()
    return parse(expression, { currentDate })
  } catch {
    return null
  }
}

const readPoint = (iterator, type) => {
  if (!iterator || typeof iterator[type] !== 'function') return null

  try {
    const value = iterator[type]()
    const date = toDate(value)
    if (!date) return null

    return {
      time: formatTime(date),
      pos: toPercent(date),
      timestamp: date.getTime(),
    }
  } catch {
    return null
  }
}

const getPastPoints = (expression, now) => {
  const iterator = parseExpressionSafe(expression, now)
  if (!iterator) return []

  const points = []
  const first = readPoint(iterator, 'prev')
  const second = readPoint(iterator, 'prev')

  if (second) points.push(second)
  if (first) points.push(first)

  return points
}

const getNextPoint = (expression, now) => {
  const iterator = parseExpressionSafe(expression, now)
  if (!iterator) return null
  return readPoint(iterator, 'next')
}

const normalizeTask = (task) => ({
  id: task.id ?? task.Id,
  taskName: task.taskName || task.TaskName || `Task ${task.id ?? task.Id ?? ''}`.trim(),
  isEnabled: task.isEnabled ?? task.IsEnabled ?? false,
  cronExpression: normalizeCronExpression(task.cronExpression || task.CronExpression),
})

export const getDayProgressPercent = (date = new Date()) => {
  return toPercent(date)
}

export const buildCronTimelineItems = (tasks, now = new Date()) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return []

  return tasks
    .map(normalizeTask)
    .filter((task) => task.cronExpression)
    .map((task) => {
      const pastPoints = getPastPoints(task.cronExpression, now)
      const nextPoint = getNextPoint(task.cronExpression, now)

      return {
        ...task,
        pastPoints,
        nextPoint,
        parseError: pastPoints.length === 0 && !nextPoint,
      }
    })
}
