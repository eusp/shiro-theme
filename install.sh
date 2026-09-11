#!/usr/bin/env bash
# install.sh — importa todos los proyectos Shiro y los deja funcionando.
#
#   bash ~/.config/shiro-theme/install.sh            # todos los pasos, preguntando
#   bash ~/.config/shiro-theme/install.sh -y         # todos los pasos, sin preguntar
#   bash ~/.config/shiro-theme/install.sh projects links apply   # solo esos pasos
#
# Pasos: deps projects links sddm boot apply
# Correr como tu usuario (NO con sudo): pide la contraseña cuando la necesita.
# Es idempotente: si un proyecto ya está, lo deja; si está con el nombre
# antiguo (~/.config/ags, ~/.config/hypr, ~/.config/grub-theme) lo migra.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=projects.sh
source "$SCRIPT_DIR/projects.sh"

ALL_STEPS=(deps projects links sddm boot apply)
ASSUME_YES=0
STEPS=()

for arg in "$@"; do
    case "$arg" in
        -y|--yes) ASSUME_YES=1 ;;
        -h|--help) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        deps|projects|links|sddm|boot|apply) STEPS+=("$arg") ;;
        *) echo "Paso desconocido: $arg (válidos: ${ALL_STEPS[*]})" >&2; exit 1 ;;
    esac
done
[ ${#STEPS[@]} -eq 0 ] && STEPS=("${ALL_STEPS[@]}")

if [ "$(id -u)" -eq 0 ]; then
    echo "Corre install.sh como tu usuario, sin sudo." >&2
    exit 1
fi

step() {
    echo
    echo "====================================="
    echo " $1"
    echo "====================================="
}

ask() {
    [ "$ASSUME_YES" = 1 ] && return 0
    local reply
    read -rp "$1 [S/n]: " reply
    [[ ! "$reply" =~ ^[nN]$ ]]
}

have() { command -v "$1" &>/dev/null; }

have_grub() { have grub-mkconfig || have grub2-mkconfig; }
have_limine() { have limine || compgen -G "/boot/limine.conf" >/dev/null || compgen -G "/boot/EFI/*/limine.conf" >/dev/null; }

backup_path() { echo "$1.bak-$(date +%Y%m%d-%H%M%S)"; }

# ─── deps ────────────────────────────────────────────────────────────────────

AUR_PACKAGES=(mpvpaper libastal-io-git libastal-4-git)

step_deps() {
    step "Dependencias"

    if ! have pacman; then
        echo "No es Arch/CachyOS: instala las dependencias a mano"
        echo "(Fedora/Nobara: ver ~/.config/shiro-ags/SETUP.md)."
        return 0
    fi

    local -a pkgs=(
        # base
        git base-devel nodejs npm curl github-cli ntfs-3g
        # Hyprland
        hyprland hyprpaper hyprlock xdg-desktop-portal-hyprland lxqt-policykit
        wl-clipboard cliphist grim slurp ptyxis nautilus
        # AGS (runtime + compilación)
        gjs gtk4 gtk4-layer-shell dart-sass libnotify
        meson ninja go gobject-introspection
        # servicios que lee el shell
        networkmanager nm-connection-editor upower bluez bluez-utils brightnessctl
        pipewire-pulse wireplumber libpulse pavucontrol
        # audio-route.sh entre equipos (resolver *.local)
        avahi nss-mdns
        # fuentes e iconos
        ttf-jetbrains-mono-nerd adwaita-icon-theme
    )
    # CachyOS puede traer tuned-ppd, que ya da powerprofilesctl y choca con power-profiles-daemon
    have powerprofilesctl || pkgs+=(power-profiles-daemon)

    if ask "¿Instalar paquetes de los repos (${#pkgs[@]} paquetes)?"; then
        sudo pacman -S --needed "${pkgs[@]}"
    fi

    local aur=""
    if have paru; then aur=paru; elif have yay; then aur=yay; fi
    if [ -z "$aur" ] && ask "No hay helper de AUR. ¿Instalar paru (repo de CachyOS)?"; then
        sudo pacman -S --needed paru && aur=paru
    fi
    if [ -n "$aur" ]; then
        ask "¿Instalar desde AUR: ${AUR_PACKAGES[*]}?" && "$aur" -S --needed "${AUR_PACKAGES[@]}"
    else
        echo "⚠ Sin helper de AUR: instala a mano ${AUR_PACKAGES[*]}"
    fi

    # AGS se compila e instala en /usr/local: shiro-ags/package.json apunta a /usr/local/share/ags/js
    if have ags; then
        echo "✓ AGS ya instalado: $(ags --version 2>/dev/null || echo '?')"
    elif ask "¿Compilar AGS v3 desde el código fuente en ~/ags (se instala en /usr/local)?"; then
        [ -d "$USER_HOME/ags/.git" ] || git clone https://github.com/aylur/ags.git "$USER_HOME/ags"
        (
            cd "$USER_HOME/ags"
            npm install
            meson setup build --wipe 2>/dev/null || meson setup build
            sudo meson install -C build
        )
    fi

    if systemctl list-unit-files avahi-daemon.service &>/dev/null; then
        sudo systemctl enable --now avahi-daemon.service || true
    fi
    if ! grep -q mdns /etc/nsswitch.conf && ask "¿Activar resolución mDNS (*.local) en /etc/nsswitch.conf?"; then
        sudo cp /etc/nsswitch.conf "$(backup_path /etc/nsswitch.conf)"
        sudo sed -i -E 's/^(hosts:.*)\bresolve\b/\1mdns_minimal [NOTFOUND=return] resolve/' /etc/nsswitch.conf
        grep '^hosts:' /etc/nsswitch.conf
    fi

    for svc in NetworkManager bluetooth; do
        sudo systemctl enable --now "$svc.service" 2>/dev/null || true
    done

    if compgen -G "/sys/class/backlight/*" >/dev/null && ! id -nG | grep -qw video; then
        sudo usermod -aG video "$SHIRO_USER" && echo "✓ Agregado al grupo video (vuelve a iniciar sesión)"
    fi
}

# ─── projects ────────────────────────────────────────────────────────────────

import_project() {
    local name repo dir link legacy
    IFS='|' read -r name repo dir link legacy <<<"$1"
    local url="https://github.com/$GITHUB_USER/$repo.git"

    local -a SUDO=()
    [ -w "$(dirname "$dir")" ] || SUDO=(sudo)

    if [ -d "$dir/.git" ]; then
        echo "✓ $name ya está en $dir"
    elif [ -n "$legacy" ] && [ ! -L "$legacy" ] && [ -d "$legacy/.git" ]; then
        echo "→ $name: migrando $legacy → $dir"
        [ -w "$(dirname "$legacy")" ] || SUDO=(sudo)
        "${SUDO[@]}" mv "$legacy" "$dir"
        # Hyprland/AGS esperan la ruta antigua: el symlink va enseguida
        [ -n "$link" ] && [ "$link" = "$legacy" ] && ln -s "$dir" "$link"
    else
        if [ -e "$dir" ]; then
            local bak; bak="$(backup_path "$dir")"
            echo "→ $dir existe pero no es un repo: se mueve a $bak"
            "${SUDO[@]}" mv "$dir" "$bak"
        fi
        echo "→ $name: clonando $url"
        "${SUDO[@]}" mkdir -p "$(dirname "$dir")"
        "${SUDO[@]}" git clone "$url" "$dir"
    fi

    # Todo queda del usuario: build.js escribe aquí sin root (hot-reload desde AGS)
    if [ -n "$(find "$dir" ! -user "$SHIRO_USER" -print -quit 2>/dev/null)" ]; then
        sudo chown -R "$SHIRO_USER:$(id -gn "$SHIRO_USER")" "$dir"
    fi
    git -C "$dir" remote set-url origin "$url"
}

step_projects() {
    step "Proyectos"

    if [ -d "$THEME_DIR/.git" ]; then
        git -C "$THEME_DIR" remote set-url origin "https://github.com/$GITHUB_USER/shiro-theme.git"
        echo "✓ shiro-theme en $THEME_DIR"
    fi

    local entry
    for entry in "${SHIRO_PROJECTS[@]}"; do
        import_project "$entry"
    done

    if [ ! -d "$THEME_DIR/node_modules/pngjs" ] && have npm; then
        (cd "$THEME_DIR" && npm install --no-audit --no-fund)
    fi
    if [ ! -d "$USER_HOME/.config/shiro-ags/node_modules" ] && [ -d /usr/local/share/ags/js ] && have npm; then
        # Solo tipos para el editor / npm run check; AGS no lo necesita para arrancar
        (cd "$USER_HOME/.config/shiro-ags" && npm install --no-audit --no-fund) || true
    fi
}

# ─── links ───────────────────────────────────────────────────────────────────

step_links() {
    step "Symlinks y servicios"

    local entry name repo dir link legacy
    for entry in "${SHIRO_PROJECTS[@]}"; do
        IFS='|' read -r name repo dir link legacy <<<"$entry"
        [ -n "$link" ] || continue
        if [ ! -d "$dir" ]; then
            echo "⚠ Falta $dir (corre antes el paso 'projects')"
            continue
        fi

        if [ -L "$link" ]; then
            ln -sfn "$dir" "$link"
        elif [ -e "$link" ]; then
            local bak; bak="$(backup_path "$link")"
            echo "→ $link existe (config por defecto de la distro): se mueve a $bak"
            mv "$link" "$bak"
            ln -s "$dir" "$link"
        else
            ln -s "$dir" "$link"
        fi
        echo "✓ $link → $dir"
    done

    local unit="$USER_HOME/.config/shiro-hyprland/systemd/normalize-volume.service"
    if [ -f "$unit" ] && systemctl --user show-environment &>/dev/null; then
        mkdir -p "$USER_HOME/.config/systemd/user"
        ln -sfn "$unit" "$USER_HOME/.config/systemd/user/normalize-volume.service"
        systemctl --user daemon-reload
        systemctl --user enable normalize-volume.service
        echo "✓ normalize-volume.service habilitado"
    fi
}

# ─── sddm ────────────────────────────────────────────────────────────────────

step_sddm() {
    step "SDDM"

    if [ ! -f "$SDDM_DIR/install.sh" ]; then
        echo "⚠ No está $SDDM_DIR (corre antes el paso 'projects')"
        return 0
    fi

    if ask "¿Instalar el tema shiro-sddm (dependencias, fuentes y /etc/sddm.conf.d)?"; then
        bash "$SDDM_DIR/install.sh"
        sudo chown -R "$SHIRO_USER:$(id -gn "$SHIRO_USER")" "$SDDM_DIR"
    fi

    local current
    current="$(readlink /etc/systemd/system/display-manager.service 2>/dev/null || true)"
    if [[ "$current" != *sddm.service ]] && ask "Display manager actual: ${current:-ninguno}. ¿Activar SDDM?"; then
        sudo systemctl enable --force sddm.service
    fi
}

# ─── boot ────────────────────────────────────────────────────────────────────

step_boot() {
    step "Bootloader (GRUB / Limine)"

    if have_grub; then
        echo "✓ GRUB detectado → shiro-grub"
    elif have_limine; then
        echo "✓ Limine detectado → shiro-limine"
    else
        echo "No se detectó GRUB ni Limine (¿systemd-boot?): se omite el tema de arranque."
        return 0
    fi

    local node; node="$(command -v node)"
    local rule="$SHIRO_USER ALL=(ALL) NOPASSWD: $node $THEME_DIR/build-boot.js"
    if ! sudo grep -qxF "$rule" /etc/sudoers.d/shiro-boot 2>/dev/null \
        && ask "¿Crear regla sudoers para que AGS aplique el tema de arranque sin contraseña?"; then
        local tmp; tmp="$(mktemp)"
        echo "$rule" >"$tmp"
        sudo visudo -cf "$tmp" && sudo install -m 440 -o root -g root "$tmp" /etc/sudoers.d/shiro-boot
        rm -f "$tmp"
        # Regla anterior (build-grub.js), reemplazada por esta
        sudo rm -f /etc/sudoers.d/shiro-grub
        echo "✓ /etc/sudoers.d/shiro-boot"
    fi
}

# ─── apply ───────────────────────────────────────────────────────────────────

step_apply() {
    step "Aplicar tema ($(cat "$THEME_DIR/current-theme"))"

    node "$THEME_DIR/build.js"

    if have_grub || have_limine; then
        sudo node "$THEME_DIR/build-boot.js"
    fi
}

for s in "${STEPS[@]}"; do
    "step_$s"
done

echo
echo "✓ Listo. Si es la primera instalación, reinicia para entrar por SDDM a Hyprland."
