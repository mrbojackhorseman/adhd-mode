"use client";

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const html = parseMarkdown(content);
  return (
    <div
      className="prose-adhd"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function parseMarkdown(text: string): string {
  let html = text;

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_, header, rows) => {
    const ths = header.split("|").filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join("");
    const trs = rows.trim().split("\n").map((row: string) => {
      const tds = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join("");
      return `<tr>${tds}</tr>`;
    }).join("");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr/>");

  // Blockquote
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered lists
  html = html.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split("\n").map((line) => {
      const content = line.replace(/^[-*] /, "");
      return `<li>${content}</li>`;
    }).join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split("\n").map((line) => {
      const content = line.replace(/^\d+\. /, "");
      return `<li>${content}</li>`;
    }).join("");
    return `<ol>${items}</ol>`;
  });

  // Paragraphs — wrap bare lines not already wrapped in a tag
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, "<p>$1</p>");

  return html;
}
