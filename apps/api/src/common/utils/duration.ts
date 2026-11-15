/** Parses durations like "900", "30s", "15m", "12h", "7d" into seconds. */
export function parseDurationSeconds(value: string): number {
  const match = /^(\d+)\s*([smhd]?)$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const amount = Number(match[1]);
  const unit = match[2] || 's';
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit as 's' | 'm' | 'h' | 'd'];
  return amount * factor;
}
