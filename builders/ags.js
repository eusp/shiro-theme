const {
  fs,
  path,
  HOME,
  theme,
} = require("../shared");

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return "0, 0, 0";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

const content = `/* AUTO GENERATED — do not edit manually */

* {
  /* Base */
  --base: ${theme.base};
  --base-rgb: ${hexToRgb(theme.base)};
  --text: ${theme.text};
  --text-rgb: ${hexToRgb(theme.text)};
  --subtext0: ${theme.subtext0};
  --subtext0-rgb: ${hexToRgb(theme.subtext0)};

  /* Surfaces */
  --surface0: ${theme.surface0};
  --surface0-rgb: ${hexToRgb(theme.surface0)};
  --surface1: ${theme.surface1};
  --surface1-rgb: ${hexToRgb(theme.surface1)};
  --surface2: ${theme.surface2};
  --surface2-rgb: ${hexToRgb(theme.surface2)};

  /* Overlays */
  --overlay0: ${theme.overlay0};
  --overlay0-rgb: ${hexToRgb(theme.overlay0)};
  --overlay1: ${theme.overlay1};
  --overlay1-rgb: ${hexToRgb(theme.overlay1)};

  /* Primary */
  --primary: ${theme.primary};
  --primary-rgb: ${hexToRgb(theme.primary)};
  --primary-alt: ${theme.primaryAlt};
  --primary-alt-rgb: ${hexToRgb(theme.primaryAlt)};
  --primary-muted: ${theme.primaryMuted};
  --primary-muted-rgb: ${hexToRgb(theme.primaryMuted)};

  /* Semantic */
  --danger: ${theme.danger};
  --danger-rgb: ${hexToRgb(theme.danger)};
  --warning: ${theme.warning};
  --warning-rgb: ${hexToRgb(theme.warning)};
  --success: ${theme.success};
  --success-rgb: ${hexToRgb(theme.success)};
  --info: ${theme.info};
  --info-rgb: ${hexToRgb(theme.info)};

  /* Accents */
  --accent0: ${theme.accent0};
  --accent0-rgb: ${hexToRgb(theme.accent0)};
  --accent1: ${theme.accent1};
  --accent1-rgb: ${hexToRgb(theme.accent1)};
  --accent2: ${theme.accent2};
  --accent2-rgb: ${hexToRgb(theme.accent2)};
  --accent3: ${theme.accent3};
  --accent3-rgb: ${hexToRgb(theme.accent3)};

  /* Layers */
  --mantle: ${theme.mantle};
  --mantle-rgb: ${hexToRgb(theme.mantle)};
  --crust: ${theme.crust};
  --crust-rgb: ${hexToRgb(theme.crust)};
}
`;

fs.writeFileSync(
  path.join(HOME, ".config/ags/styles/colors.scss"),
  content
);

console.log("✓ AGS");
