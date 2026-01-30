import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import chalk from "chalk";
import theme from "../theme/theme.js";
import type { MarkedExtension } from "marked";

marked.use(
  markedTerminal({
    code: chalk.hex(theme.colors.accent),
    blockquote: chalk.hex(theme.colors.muted).italic,
    html: chalk.hex(theme.colors.muted),
    heading: chalk.hex(theme.colors.primary).bold,
    firstHeading: chalk.hex(theme.colors.primary).underline.bold,
    hr: chalk.hex(theme.colors.border),
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.hex(theme.colors.accent),
    del: chalk.dim.strikethrough,
    link: chalk.hex(theme.colors.secondary),
    href: chalk.hex(theme.colors.secondary).underline,
    reflowText: false,
    tab: 2,
    showSectionPrefix: false,
  }) as unknown as MarkedExtension
);

export function renderMarkdown(text: string): string {
  const result = marked.parse(text);
  return (typeof result === "string" ? result : String(result)).trimEnd();
}
