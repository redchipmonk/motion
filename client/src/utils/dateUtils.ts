export const formatPastDateLabel = (startsAt?: string): string | null => {
  if (!startsAt) return null
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
