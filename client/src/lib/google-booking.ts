export function googleBookingUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (
      url.protocol !== "https:" ||
      url.hostname !== "calendar.google.com" ||
      url.port || url.username || url.password ||
      !/^\/calendar\/(?:u\/\d+\/)?appointments\/schedules\/[^/]+\/?$/.test(url.pathname)
    ) return null
    url.searchParams.set("gv", "true")
    return url.href
  } catch {
    return null
  }
}
