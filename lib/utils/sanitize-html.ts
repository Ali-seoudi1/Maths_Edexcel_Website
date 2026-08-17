const dangerousBlockElementPattern =
  /<\s*(script|style|iframe|object|embed|svg|math|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;
const dangerousElementPattern =
  /<\s*(script|style|iframe|object|embed|link|meta|base|svg|math|form|input|button|textarea|select|option)\b[^>]*\/?>/gi;
const eventHandlerAttributePattern = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const dangerousUrlAttributePattern =
  /\s+(href|src)\s*=\s*("[^"]*\s*(javascript:|data:)[^"]*"|'[^']*\s*(javascript:|data:)[^']*'|[^\s>]*(javascript:|data:)[^\s>]*)/gi;

export function sanitizeTeacherSolutionHtml(value: string) {
  return value
    .replace(dangerousBlockElementPattern, "")
    .replace(dangerousElementPattern, "")
    .replace(eventHandlerAttributePattern, "")
    .replace(dangerousUrlAttributePattern, "");
}
