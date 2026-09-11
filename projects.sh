# Manifiesto de proyectos Shiro — lo usan manage.sh e install.sh.
# (Los builders de Node definen las mismas rutas en shared.js.)
#
# Formato: nombre|repo en GitHub|carpeta real|symlink de compatibilidad|carpeta antigua
#   - symlink: ruta que el programa espera (Hyprland solo lee ~/.config/hypr).
#   - carpeta antigua: nombre previo al renombrado, para migrar instalaciones viejas.

if [ -n "${SUDO_USER:-}" ]; then
    USER_HOME="/home/$SUDO_USER"
    SHIRO_USER="$SUDO_USER"
else
    USER_HOME="$HOME"
    SHIRO_USER="$USER"
fi

GITHUB_USER="eusp"
THEME_DIR="$USER_HOME/.config/shiro-theme"
SDDM_DIR="/usr/share/sddm/themes/shiro-sddm"

SHIRO_PROJECTS=(
    "shiro-ags|shiro-ags|$USER_HOME/.config/shiro-ags|$USER_HOME/.config/ags|$USER_HOME/.config/ags"
    "shiro-hyprland|shiro-hyprland|$USER_HOME/.config/shiro-hyprland|$USER_HOME/.config/hypr|$USER_HOME/.config/hypr"
    "shiro-grub|shiro-grub|$USER_HOME/.config/shiro-grub||$USER_HOME/.config/grub-theme"
    "shiro-limine|shiro-limine|$USER_HOME/.config/shiro-limine||"
    "shiro-sddm|shiro-sddm|$SDDM_DIR||/usr/share/sddm/themes/silent"
)

# Carpetas de todos los repos (shiro-theme incluido), en orden.
shiro_repo_dirs() {
    echo "$THEME_DIR"
    local entry
    for entry in "${SHIRO_PROJECTS[@]}"; do
        echo "$entry" | cut -d'|' -f3
    done
}
