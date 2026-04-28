/**
 * Minimalny renderer markdown dla treści blogowych i opisów kursów.
 * Obsługuje: nagłówki h2/h3, paragrafy, listy nieuporządkowane, **bold**,
 * *italic*, `code`, [linki](url). Bez HTML, bez XSS — wszystko renderowane
 * przez React jako tekst, więc tagi w treści nie zostaną wykonane.
 */

import { Fragment, type ReactNode } from "react";

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "p"; text: string };

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("## ") && !lines[i].startsWith("### ") && !/^\s*[-*]\s+/.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }

  return blocks;
}

function renderInline(text: string, keyBase: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const re =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;

  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push(text.slice(last, m.index));
    const key = `${keyBase}-${idx++}`;
    if (m[1]) tokens.push(<strong key={key}>{m[2]}</strong>);
    else if (m[3]) tokens.push(<em key={key}>{m[4]}</em>);
    else if (m[5])
      tokens.push(
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
          {m[6]}
        </code>,
      );
    else if (m[7]) {
      const href = m[9];
      const safe = /^(https?:|\/)/i.test(href) ? href : "#";
      tokens.push(
        <a key={key} href={safe} className="underline underline-offset-4 hover:text-foreground" target={safe.startsWith("http") ? "_blank" : undefined} rel={safe.startsWith("http") ? "noopener noreferrer" : undefined}>
          {m[8]}
        </a>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) tokens.push(text.slice(last));
  return tokens;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const k = `b-${i}`;
        if (b.type === "h2")
          return (
            <h2 key={k} className="mt-8 mb-3 text-2xl font-semibold tracking-tight first:mt-0">
              {renderInline(b.text, k)}
            </h2>
          );
        if (b.type === "h3")
          return (
            <h3 key={k} className="mt-6 mb-2 text-xl font-semibold tracking-tight">
              {renderInline(b.text, k)}
            </h3>
          );
        if (b.type === "ul")
          return (
            <ul key={k} className="my-4 list-disc space-y-1.5 pl-6 text-foreground/90">
              {b.items.map((item, j) => (
                <li key={`${k}-${j}`}>{renderInline(item, `${k}-${j}`)}</li>
              ))}
            </ul>
          );
        return (
          <p key={k} className="my-4 leading-7 text-foreground/90">
            <Fragment>{renderInline(b.text, k)}</Fragment>
          </p>
        );
      })}
    </div>
  );
}
