const WINDOW_MS = 60_000;
const MAX_COMMANDS = 12;

const commands = new Map<string, number[]>();

export function acceptSimulationCommand(
  userId: string,
  now = Date.now(),
): boolean {
  const recent = (commands.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_COMMANDS) {
    commands.set(userId, recent);
    return false;
  }
  recent.push(now);
  commands.set(userId, recent);
  return true;
}

export function resetSimulationRateLimitForTests(): void {
  commands.clear();
}
