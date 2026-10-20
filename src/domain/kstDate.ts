const KST_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const BOARD_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function getKstDay(date = new Date()): string {
  return KST_DATE_FORMATTER.format(date)
}

export function formatBoardDate(date = new Date()): string {
  const parts = BOARD_DATE_FORMATTER.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value.toUpperCase() ?? ''

  return `${part('weekday')} · ${part('day')} ${part('month')} ${part('year')}`
}
