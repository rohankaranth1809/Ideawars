export function formatRemaining(endsAt: string, now = Date.now()) {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return "Ended";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function isLive(endsAt: string, now = Date.now()) {
  return new Date(endsAt).getTime() > now;
}
