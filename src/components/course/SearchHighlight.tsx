const START = "«««";
const END = "»»»";

export function SearchHighlight({ snippet, fallback }: { snippet: string; fallback?: string | null }) {
  if (!snippet || !snippet.includes(START)) {
    if (snippet) return <>{snippet}</>;
    return fallback ? <>{fallback}</> : null;
  }

  const parts: Array<{ text: string; mark: boolean }> = [];
  let rest = snippet;
  while (rest.length > 0) {
    const startIdx = rest.indexOf(START);
    if (startIdx === -1) {
      parts.push({ text: rest, mark: false });
      break;
    }
    if (startIdx > 0) parts.push({ text: rest.slice(0, startIdx), mark: false });
    const endIdx = rest.indexOf(END, startIdx + START.length);
    if (endIdx === -1) {
      parts.push({ text: rest.slice(startIdx + START.length), mark: true });
      break;
    }
    parts.push({ text: rest.slice(startIdx + START.length, endIdx), mark: true });
    rest = rest.slice(endIdx + END.length);
  }

  return (
    <>
      {parts.map((p, i) =>
        p.mark ? (
          <mark key={i} className="rounded-sm bg-yellow-200/80 px-0.5 text-foreground dark:bg-yellow-400/30">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
