import chalk from "chalk";

// ── Catppuccin Mocha-inspired palette ──
const palette = {
  mauve:     "#cba6f7",
  blue:      "#89b4fa",
  sapphire:  "#74c7ec",
  sky:       "#89dceb",
  teal:      "#94e2d5",
  green:     "#a6e3a1",
  yellow:    "#f9e2af",
  peach:     "#fab387",
  red:       "#f38ba8",
  text:      "#cdd6f4",
  subtext1:  "#bac2de",
  overlay1:  "#7f849c",
  overlay0:  "#6c7086",
  surface2:  "#585b70",
  surface1:  "#45475a",
  surface0:  "#313244",
  base:      "#1e1e2e",
  crust:     "#11111b",
} as const;

export const theme = {
  colors: {
    primary:   palette.mauve,
    secondary: palette.blue,
    accent:    palette.peach,
    muted:     palette.overlay0,
    success:   palette.green,
    warning:   palette.yellow,
    error:     palette.red,
    info:      palette.sky,
    border:    palette.surface2,
    surface:   palette.surface0,
    text:      palette.text,
    dimText:   palette.overlay1,
    crust:     palette.crust,
  },
  styles: {
    primary:    chalk.hex(palette.mauve),
    secondary:  chalk.hex(palette.blue),
    accent:     chalk.hex(palette.peach),
    muted:      chalk.hex(palette.overlay0),
    success:    chalk.hex(palette.green),
    warning:    chalk.hex(palette.yellow),
    error:      chalk.hex(palette.red),
    info:       chalk.hex(palette.sky),
    dim:        chalk.hex(palette.overlay1),
    text:       chalk.hex(palette.text),
  },
  glyphs: {
    app:        "◆",
    user:       "❯",
    assistant:  "◆",
    branch:     "",
    separator:  "─",
    vertSep:    "│",
    check:      "✓",
    cross:      "✗",
    warning:    "⚠",
    arrowRight: "→",
    hLine:      "─",
    vLine:      "│",
  },
} as const;

export type Theme = typeof theme;
export default theme;
