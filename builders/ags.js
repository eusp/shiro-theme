const {
  fs,
  path,
  theme,
} = require("../shared");

const content = `// AUTO GENERATED

// Base
$base: ${theme.base};
$text: ${theme.text};
$subtext0: ${theme.subtext0};

// Surfaces
$surface0: ${theme.surface0};
$surface1: ${theme.surface1};
$surface2: ${theme.surface2};

// Overlays
$overlay0: ${theme.overlay0};
$overlay1: ${theme.overlay1};

// Primary
$primary: ${theme.primary};
$primary-alt: ${theme.primaryAlt};
$primary-muted: ${theme.primaryMuted};

// Semantic
$danger: ${theme.danger};
$warning: ${theme.warning};
$success: ${theme.success};
$info: ${theme.info};

// Accents
$accent0: ${theme.accent0};
$accent1: ${theme.accent1};
$accent2: ${theme.accent2};
$accent3: ${theme.accent3};

// Layers
$mantle: ${theme.mantle};
$crust: ${theme.crust};
`;

fs.writeFileSync(
  path.join(
    process.env.HOME,
    ".config/ags/styles/colors.scss"
  ),
  content
);

console.log("✓ AGS");