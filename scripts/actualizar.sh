#!/usr/bin/env bash
# Actualiza Shiro o todo el sistema. Lo abren los íconos "Actualizar Shiro" y
# "Actualizar sistema" (applications/*.desktop) en una terminal.
#
# Uso:  actualizar.sh shiro     repos de GitHub + tema + reiniciar AGS
#       actualizar.sh sistema   paquetes (paru, flatpak) y después lo de shiro

set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=../projects.sh
source "$SCRIPT_DIR/../projects.sh"

titulo() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }

actualizar_shiro() {
    titulo "Repositorios Shiro"
    local dir out fallos=0
    while read -r dir; do
        [ -d "$dir/.git" ] || continue
        printf '→ %-16s ' "$(basename "$dir")"
        if out=$(git -c safe.directory="$dir" -C "$dir" pull --ff-only 2>&1); then
            echo "${out##*$'\n'}"
        else
            echo "NO se pudo actualizar:"
            echo "$out" | sed 's/^/    /'
            fallos=1
        fi
    done < <(shiro_repo_dirs)

    titulo "Tema ($(cat "$THEME_DIR/current-theme" 2>/dev/null || echo "por defecto"))"
    node "$THEME_DIR/build.js" 2>&1 | grep -E '✓|rror'
    hyprctl reload >/dev/null && echo "✓ Hyprland recargado"

    titulo "AGS"
    ags quit >/dev/null 2>&1
    sleep 1
    setsid -f ags run "$USER_HOME/.config/ags/app.ts" >/dev/null 2>&1
    echo "✓ AGS reiniciado"

    [ "$fallos" -eq 0 ] || echo -e "\n⚠ Algún repo no se actualizó (cambios locales). Revisa arriba."
}

actualizar_sistema() {
    titulo "Paquetes (paru)"
    paru -Syu
    if command -v flatpak >/dev/null; then
        titulo "Flatpak"
        flatpak update -y
    fi
}

case "${1:-}" in
    shiro) actualizar_shiro ;;
    sistema) actualizar_sistema; actualizar_shiro ;;
    *) echo "Uso: $0 shiro|sistema"; exit 1 ;;
esac

echo
read -rp "Listo. Presiona Enter para cerrar..." _
