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

// /usr/share/sddm is root-owned. When this runs unprivileged (e.g. the
// hot-reload triggered from AGS, not `sudo ./manage.sh`), these writes fail
// with EACCES — that must not crash the rest of build.js (AGS/Hyprland still
// need to apply). Run `sudo ./manage.sh` to actually sync the SDDM theme.
try {
  fs.writeFileSync(
    "/usr/share/sddm/themes/silent/components/Colors.qml",
    qml
  );

  const targetDir = "/usr/share/sddm/themes/silent/backgrounds";
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (fs.existsSync(wallpaperVideo)) {
    fs.copyFileSync(
      wallpaperVideo,
      `${targetDir}/background.mp4`
    );
  }

  if (fs.existsSync(wallpaperImage)) {
    fs.copyFileSync(
      wallpaperImage,
      `${targetDir}/background.png`
    );
  }

  console.log("✓ SDDM");
} catch (e) {
  console.warn(`⚠ SDDM sin permisos para escribir (correr "sudo ./manage.sh" para sincronizarlo): ${e.message}`);
}