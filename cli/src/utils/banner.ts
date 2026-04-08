import pc from "picocolors";

const YANTRA_ART = [
  "██╗   ██╗ █████╗ ███╗   ██╗████████╗██████╗  █████╗ ",
  "╚██╗ ██╔╝██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔══██╗",
  " ╚████╔╝ ███████║██╔██╗ ██║   ██║   ██████╔╝███████║",
  "  ╚██╔╝  ██╔══██║██║╚██╗██║   ██║   ██╔══██╗██╔══██║",
  "   ██║   ██║  ██║██║ ╚████║   ██║   ██║  ██║██║  ██║",
  "   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝",
] as const;

const TAGLINE = "Open-source orchestration for zero-human companies";

export function printYantraCliBanner(): void {
  const lines = [
    "",
    ...YANTRA_ART.map((line) => pc.cyan(line)),
    pc.blue("  ───────────────────────────────────────────────────────"),
    pc.bold(pc.white(`  ${TAGLINE}`)),
    "",
  ];

  console.log(lines.join("\n"));
}
