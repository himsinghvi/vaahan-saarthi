import type { ReactNode } from "react";

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${keyPrefix}-b${i}`}>{m[1]}</strong>);
    else if (m[2]) out.push(<em key={`${keyPrefix}-i${i}`}>{m[2]}</em>);
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}

const HEADING_RE = /^(#{1,4})\s+(.+)$/;
const HR_RE = /^(-{3,}|\*{3,}|_{3,})$/;
const BLOCKQUOTE_RE = /^>\s?(.*)$/;

/** Renders basic markdown: headings, lists, quotes, bold, italic. */
export default function ChatMessageBody({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  let ul: string[] = [];
  let ol: string[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const joined = para.join(" ").replace(/\s+/g, " ").trim();
    para = [];
    if (!joined) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="chat-md__p">
        {parseInline(joined, `p-${blocks.length}`)}
      </p>,
    );
  };

  const flushUl = () => {
    if (!ul.length) return;
    const items = ul;
    ul = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="chat-md__ul">
        {items.map((item, idx) => (
          <li key={idx}>{parseInline(item.trim(), `ul-${blocks.length}-${idx}`)}</li>
        ))}
      </ul>,
    );
  };

  const flushOl = () => {
    if (!ol.length) return;
    const items = ol;
    ol = [];
    blocks.push(
      <ol key={`ol-${blocks.length}`} className="chat-md__ol">
        {items.map((item, idx) => (
          <li key={idx}>{parseInline(item.trim(), `ol-${blocks.length}-${idx}`)}</li>
        ))}
      </ol>,
    );
  };

  const flushAll = () => {
    flushPara();
    flushUl();
    flushOl();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (HR_RE.test(trimmed)) {
      flushAll();
      blocks.push(<hr key={`hr-${blocks.length}`} className="chat-md__hr" />);
      continue;
    }

    const heading = trimmed.match(HEADING_RE);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const cls = level === 1 ? "chat-md__h1" : level === 2 ? "chat-md__h2" : "chat-md__h3";
      const Tag = level === 1 ? "h4" : level === 2 ? "h5" : "h6";
      blocks.push(
        <Tag key={`h-${blocks.length}`} className={cls}>
          {parseInline(heading[2].trim(), `h-${blocks.length}`)}
        </Tag>,
      );
      continue;
    }

    const quote = trimmed.match(BLOCKQUOTE_RE);
    if (quote) {
      flushAll();
      blocks.push(
        <blockquote key={`q-${blocks.length}`} className="chat-md__quote">
          {parseInline(quote[1].trim(), `q-${blocks.length}`)}
        </blockquote>,
      );
      continue;
    }

    const bullet = trimmed.match(/^[-•*]\s+(.+)/);
    if (bullet) {
      flushPara();
      flushOl();
      ul.push(bullet[1]);
      continue;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (numbered) {
      flushPara();
      flushUl();
      ol.push(numbered[1]);
      continue;
    }

    flushUl();
    flushOl();
    para.push(trimmed);
  }

  flushAll();

  if (!blocks.length) return null;
  return <div className="chat-md">{blocks}</div>;
}
