# Migración de Nobara a CachyOS

Guía para pasar el escritorio Shiro de Nobara (Fedora) a CachyOS (Arch). Resumen: **los cinco
proyectos funcionan en CachyOS**. Solo shiro-grub tiene una condición: hay que elegir GRUB en el
instalador. Todo lo demás lo resuelve `install.sh`.

## ¿Se puede mudar cada proyecto?

| Proyecto | En CachyOS | Qué cambia respecto a Nobara |
|---|---|---|
| **shiro-theme** | ✅ Sí | Solo necesita `nodejs`. `pngjs` ya viene en `node_modules/`. |
| **shiro-ags** | ✅ Sí | Astal core viene de AUR (`libastal-io-git`, `libastal-4-git`) en vez del COPR `sdegler/hyprland`. AGS se sigue compilando desde el código fuente en `/usr/local`. El código no depende de la distro (`lib/` habla directo con D-Bus, `hyprctl`, `wpctl`). |
| **shiro-hyprland** | ✅ Sí | Hyprland viene de los repos oficiales (siempre al día, sin COPR). `mpvpaper` viene de AUR. El agente polkit ahora se busca en `/usr/libexec` y en `/usr/bin` (`scripts/polkit-agent.sh`). Revisar `conf/monitors.lua`. |
| **shiro-sddm** | ✅ Sí | Su `install.sh` ya soporta `pacman` (`qt6-svg`, `qt6-multimedia-ffmpeg`, `qt6-virtualkeyboard`). Además, en CachyOS no existe el problema del nobara-updater que cambiaba SDDM por plasma-login-manager. |
| **shiro-grub** | ⚠️ Solo con GRUB | Desde enero de 2026 el instalador de CachyOS trae **Limine** por defecto. Si eliges Limine o systemd-boot, el builder de GRUB se omite solo (no rompe nada, pero no hay tema de arranque). Las rutas (`/boot/grub` en vez de `/boot/grub2`, `grub-mkconfig` en vez de `grub2-mkconfig`) se detectan solas. |

## 1. Antes de formatear (en Nobara)

1. **Subir todo a GitHub**: `sudo bash ~/.config/shiro-theme/manage.sh` → opción 4. Revisa que
   quede limpio:
   ```bash
   source ~/.config/shiro-theme/projects.sh
   shiro_repo_dirs | while read -r d; do git -C "$d" status -sb | head -1; done
   ```
2. **Respaldar lo que no está en git** (en `/mnt/Disco02` o un USB):
   - `~/.config/shiro-ags/notes.json`, `pinned.json` y `bt-devices.json` (notas, apps ancladas, dispositivos BT).
   - `~/.ssh/` (llave del SSH sin contraseña con el laptop, que usa `audio-route.sh`).
   - `/usr/share/sddm/faces/emerson.face.icon` (avatar de SDDM), si lo cambiaste.
   - La línea de `/etc/fstab` de `/mnt/Disco02` (con su UUID), para montarlo igual en CachyOS.
3. **Anotar el nombre del monitor**: `hyprctl monitors` (hoy `conf/monitors.lua` usa `HDMI-A-1`).
   El nombre depende del driver y puede cambiar.

## 2. Durante la instalación de CachyOS

- **Bootloader**: elige **GRUB** si quieres shiro-grub (Limine viene marcado por defecto).
- **Escritorio**: elige **Hyprland**. **No** elijas *Hyprland Noctalia*: trae su propio shell, que
  compite con AGS por las notificaciones, el tray y la barra. Si el perfil trae otro gestor de
  login, el paso `sddm` de `install.sh` lo cambia por SDDM.
- **Usuario**: `emerson`. Las rutas usan `$HOME`, pero `audio-route.sh` se conecta como `emerson@`.
- **Hostname**: `audio-route.sh` (shiro-ags) reconoce `nobara-pc` y `nobara-laptop`. Si les pones
  otro nombre (por ejemplo `shiro-pc`), edita `PC_HOST`/`LT_HOST` y sus `.local` al principio del script.
- **NVIDIA**: CachyOS instala el driver solo (`chwd`). La GTX 1660 (Turing) funciona con `nvidia-open`.

## 3. Después de instalar: importar todo

```bash
sudo pacman -S --needed git
git clone https://github.com/eusp/shiro-theme.git ~/.config/shiro-theme
bash ~/.config/shiro-theme/install.sh
```

Córrelo como tu usuario (sin `sudo`): pide la contraseña cuando la necesita y pregunta antes de cada
cambio (`-y` para aceptar todo). Es idempotente: puedes volver a correrlo, o correr solo un paso con
`install.sh <paso>`.

| Paso | Qué hace |
|---|---|
| `deps` | `pacman`: Hyprland, herramientas, compilación de AGS, fuentes y `avahi`/`nss-mdns`. Instala `paru` si no hay helper de AUR (CachyOS ya no lo trae). AUR: `mpvpaper`, `libastal-io-git`, `libastal-4-git`. Compila AGS v3 en `~/ags` → `/usr/local`. Activa mDNS (`*.local`), NetworkManager y bluetooth, y agrega el usuario al grupo `video` si hay backlight. |
| `projects` | Clona los proyectos (o migra carpetas con el nombre antiguo) y deja todo a nombre del usuario. |
| `links` | `~/.config/ags → shiro-ags` y `~/.config/hypr → shiro-hyprland` (la config por defecto de CachyOS queda en `*.bak-FECHA`). Habilita `normalize-volume.service`. |
| `sddm` | Corre `shiro-sddm/install.sh` (dependencias, fuentes, `/etc/sddm.conf.d/shiro-sddm.conf`) y activa SDDM como gestor de login. |
| `grub` | Si hay GRUB, crea `/etc/sudoers.d/shiro-grub` para que AGS aplique GRUB sin contraseña. |
| `apply` | `node build.js` + `sudo node build-grub.js` con el tema de `current-theme`. |

Después:

1. Restaura los respaldos (`notes.json`, `pinned.json`, `bt-devices.json`, `~/.ssh` con `chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_*`).
2. GitHub para poder subir cambios: `gh auth login && gh auth setup-git` (`github-cli` lo instala `deps`).
3. Ajusta `~/.config/shiro-hyprland/conf/monitors.lua` si `hyprctl monitors` muestra otro nombre.
4. Reinicia.

## 4. Verificación

- [ ] El arranque muestra el tema de GRUB (si elegiste GRUB).
- [ ] SDDM muestra shiro-sddm con el fondo animado.
- [ ] Hyprland arranca con AGS y el fondo. Si AGS no aparece: `ags quit; ags run ~/.config/ags/app.ts`.
- [ ] Cambiar de tema desde el RightMenu cambia colores, bordes y fondo al instante.
- [ ] `sudo -n node ~/.config/shiro-theme/build-grub.js` corre sin pedir contraseña.
- [ ] `systemctl --user status normalize-volume` está activo.
- [ ] `getent hosts nobara-laptop.local` resuelve (necesario para enviar audio al laptop).

## Referencia rápida Nobara → CachyOS

| Nobara / Fedora | CachyOS / Arch |
|---|---|
| `dnf install` | `pacman -S` (repos) / `paru -S` (AUR) |
| COPR `sdegler/hyprland` (astal) | AUR `libastal-io-git`, `libastal-4-git` |
| `/boot/grub2`, `grub2-mkconfig` | `/boot/grub`, `grub-mkconfig` (detectado solo) |
| `/usr/libexec/lxqt-policykit-agent` | `/usr/bin/lxqt-policykit-agent` (lo resuelve `polkit-agent.sh`) |
| mDNS (`*.local`) activo por defecto | Requiere `avahi` + `nss-mdns` + `/etc/nsswitch.conf` (lo hace `deps`) |
| `power-profiles-daemon` | CachyOS puede traer `tuned-ppd` (también da `powerprofilesctl`) |
| nobara-updater cambia SDDM por plasma-login-manager | No aplica |

## Laptop (mientras siga en Nobara)

Los repos cambiaron de nombre en GitHub (las URLs viejas redirigen) y las carpetas ahora son
`shiro-*`. En el laptop hay que migrar una vez; si no, el cambio de tema desde AGS falla porque
los builders escriben en `~/.config/shiro-ags`:

```bash
git -C ~/.config/shiro-theme pull
bash ~/.config/shiro-theme/install.sh projects links sddm apply
```

`projects` renombra `~/.config/ags`, `~/.config/hypr`, `~/.config/grub-theme` (y
`/usr/share/sddm/themes/silent`, si existe) a sus nombres `shiro-*`, y deja los symlinks.

## Pendientes conocidos (no bloquean la migración)

- `conf/monitors.lua` tiene fijo `HDMI-A-1` y el repo es el mismo para el PC y el laptop.
- La captura con `Print` guarda en `~/Imágenes`: requiere que el sistema esté en español
  (`xdg-user-dirs`), o cambiar la ruta en `conf/bindings.lua`.
- `hyprland-session.target` en `~/.config/systemd/user/` no está en ningún repo y nada lo usa. No
  hace falta recrearlo.
