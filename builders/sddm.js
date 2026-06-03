const fs = require("fs");

const {
  theme,
  wallpaperVideo,
  wallpaperImage,
} = require("../shared");

//
// Colors.qml
//

const qml = `import QtQuick

QtObject {

    readonly property color base: "${theme.base}"
    readonly property color text: "${theme.text}"
    readonly property color subtext0: "${theme.subtext0}"

    readonly property color surface0: "${theme.surface0}"
    readonly property color surface1: "${theme.surface1}"
    readonly property color surface2: "${theme.surface2}"

    readonly property color overlay0: "${theme.overlay0}"
    readonly property color overlay1: "${theme.overlay1}"

    readonly property color primary: "${theme.primary}"
    readonly property color primaryAlt: "${theme.primaryAlt}"
    readonly property color primaryMuted: "${theme.primaryMuted}"

    readonly property color danger: "${theme.danger}"
    readonly property color warning: "${theme.warning}"
    readonly property color success: "${theme.success}"
    readonly property color info: "${theme.info}"

    readonly property color accent0: "${theme.accent0}"
    readonly property color accent1: "${theme.accent1}"
    readonly property color accent2: "${theme.accent2}"
    readonly property color accent3: "${theme.accent3}"

    readonly property color mantle: "${theme.mantle}"
    readonly property color crust: "${theme.crust}"
}
`;

fs.writeFileSync(
  "/usr/share/sddm/themes/silent/components/Colors.qml",
  qml
);

if (fs.existsSync(wallpaperVideo)) {
  fs.copyFileSync(
    wallpaperVideo,
    "/usr/share/sddm/themes/silent/backgrounds/background.mp4"
  );
}

if (fs.existsSync(wallpaperImage)) {
  fs.copyFileSync(
    wallpaperImage,
    "/usr/share/sddm/themes/silent/backgrounds/background.png"
  );
}

console.log("✓ SDDM");