/** Calendar date YYYY-MM-DD in Africa/Kampala (no DST). */
export function getKampalaCalendarDate(offsetDays = 0): string {
  const instant = new Date(Date.now() + offsetDays * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala' }).format(instant)
}
