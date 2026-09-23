# Shiro Theme

Sistema de temas centralizado para el escritorio Hyprland. Aplica un tema de forma simultánea a AGS, Hyprland, SDDM y el bootloader (GRUB o Limine) desde un único archivo JSON. Soporta cambio de tema en caliente desde el widget de AGS sin reiniciar nada.

Es el repo que une todos los proyectos Shiro: los instala (`install.sh`), los actualiza y sube (`manage.sh`) y les genera los colores (`builders/`).

## Proyectos

| Proyecto | Carpeta | Qué es |
|----------|---------|--------|
| [shiro-theme](https://github.com/eusp/shiro-theme) | `~/.config/shiro-theme` | Este repo: temas, builders e instalador |
| [shiro-ags](https://github.com/eusp/shiro-ags) | `~/.config/shiro-ags` (symlink `~/.config/ags`) | Shell AGS v3: barras, menús, selector de temas |
| [shiro-hyprland](https://github.com/eusp/shiro-hyprland) | `~/.config/shiro-hyprland` (symlink `~/.config/hypr`) | Configuración de Hyprland en Lua |
| [shiro-sddm](https://github.com/eusp/shiro-sddm) | `/usr/share/sddm/themes/shiro-sddm` | Tema de la pantalla de login |
| [shiro-grub](https://github.com/eusp/shiro-grub) | `~/.config/shiro-grub` → `/boot/grub*/themes/shiro-grub` | Tema de arranque si el sistema usa GRUB |
| [shiro-limine](https://github.com/eusp/shiro-limine) | `~/.config/shiro-limine` → bloque en `limine.conf` | Tema de arranque si el sistema usa Limine |

Los symlinks existen porque Hyprland solo lee `~/.config/hypr` y `ags run` usa `~/.config/ags` por defecto. Las carpetas de cada proyecto están definidas en `projects.sh` (scripts de bash) y `shared.js` (builders).

## Instalación en un sistema nuevo

```bash
git clone https://github.com/eusp/shiro-theme.git ~/.config/shiro-theme
bash ~/.config/shiro-theme/install.sh
```

`install.sh` instala dependencias (Arch/CachyOS), clona o migra los proyectos, crea los symlinks, instala SDDM, configura el tema de arranque (GRUB o Limine) y aplica el tema. Pasos sueltos: `install.sh projects links apply`. Guía completa de migración desde Nobara: **[CACHYOS.md](CACHYOS.md)**.

## Temas disponibles

| Tema | Descripción |
|------|-------------|
| `frozen-rukia` | Azul hielo profundo — frío y minimalista |
| `cyberpunk` | Neón vibrante sobre fondo oscuro |
| `kurisu-neon` | Inspirado en el anime, violeta y cyan |
| `violet-night` | Púrpura oscuro, elegante |
| `monochrome-city` | Blanco y negro estilo manga — tramas de tinta y luz de atardecer |

## Uso rápido

### Desde AGS (hot-reload)

El RightMenu de AGS incluye un selector de temas integrado. Cada tarjeta de tema tiene dos íconos — animado (`.mp4`) y estático (`.png`) — que aplican ese tema con el fondo en el modo elegido. Al hacer clic:

1. Los colores de AGS cambian instantáneamente (sin reiniciar).
2. `build.js` se ejecuta en segundo plano — actualiza AGS y Hyprland. Si además tenés permisos de escritura en `/usr/share/sddm` (por ejemplo corriendo `manage.sh` con `sudo`), también actualiza SDDM; si no, lo salta con un aviso sin frenar el resto.
3. Hyprland recarga su configuración → los bordes de ventana cambian al color del nuevo tema.
4. El fondo de pantalla se recarga via `~/.config/hypr/scripts/change-wallpaper.sh`, respetando el modo (animado/estático) que hayas elegido — guardado en `wallpaper-mode`.
5. El tema de arranque (GRUB o Limine, el que tenga el sistema) se actualiza con `sudo -n node build-boot.js` (requiere regla sudoers, ver abajo).

`build.js` nunca toca el bootloader directamente — eso es trabajo exclusivo de `build-boot.js`, porque escribir en `/boot` necesita root y `build.js` está pensado para correr sin privilegios (así el hot-reload desde AGS no se cae).

### Desde terminal

```bash
sudo bash manage.sh
```

Menú interactivo con opciones:
1. **Actualizar repositorios** — hace `git pull` en shiro-ags, shiro-hyprland, shiro-grub y shiro-sddm. Si hay cambios locales en conflicto, pregunta si sobrescribirlos o dejar ese repo como está.
2. **Aplicar tema** — selecciona un tema y lo genera
3. **Actualizar + Aplicar** — combina las dos anteriores
4. **Subir cambios a GitHub** — revisa shiro-theme y los cuatro proyectos; si hay cambios sin confirmar te pregunta el mensaje de commit, y sube (`git push`) lo que esté adelantado al remoto
5. **Instalar / importar proyectos** — corre `install.sh` (usarlo sin `sudo`: `bash install.sh`)
6. **Salir**

También puedes aplicar solo un builder específico:

```bash
node builders/ags.js       # Solo AGS (colors.scss)
node builders/hyprland.js  # Solo Hyprland
node builders/sddm.js      # Solo SDDM
sudo node builders/grub.js    # Solo GRUB (requiere root)
sudo node builders/limine.js  # Solo Limine (requiere root)
```

O cambiar el tema activo directamente:

```bash
echo "cyberpunk" > current-theme
node build.js              # Todo excepto el bootloader
sudo node build-boot.js    # GRUB o Limine por separado
```

## Estructura

```
shiro-theme/
├── themes/            # Paletas de color en JSON
│   ├── frozen-rukia.json
│   ├── cyberpunk.json
│   ├── kurisu-neon.json
│   └── violet-night.json
├── wallpapers/        # Wallpaper por tema (.png y/o .mp4)
├── builders/          # Generadores por target
│   ├── ags.js         → ~/.config/shiro-ags/styles/colors.scss
│   ├── hyprland.js    → ~/.config/shiro-hyprland/conf/colors.lua + wallpapers/
│   ├── sddm.js        → /usr/share/sddm/themes/shiro-sddm/
│   ├── grub.js        → ~/.config/shiro-grub/ → /boot/grub*/themes/shiro-grub
│   └── limine.js      → ~/.config/shiro-limine/ → bloque en limine.conf + fondo en el ESP
├── shared.js          # Lee current-theme, exporta el JSON y las carpetas de cada proyecto
├── build.js           # Ejecuta builders de AGS, Hyprland y SDDM (sin root)
├── build-boot.js      # Builders de GRUB y Limine; cada uno se omite si su bootloader no está (requiere sudo)
├── build-grub.js      # Alias de build-boot.js para reglas sudoers antiguas
├── projects.sh        # Manifiesto de proyectos (repo, carpeta, symlink) para manage.sh e install.sh
├── install.sh         # Instala / importa / migra todos los proyectos
├── manage.sh          # Menú de administración interactivo
├── CACHYOS.md         # Guía de migración Nobara → CachyOS
├── current-theme      # Nombre del tema activo (texto plano)
└── wallpaper-mode     # "animated" o "static" — qué fondo usar (texto plano)
```

## Cómo funciona el hot-reload de colores

Los colores de AGS se definen como **CSS custom properties** (variables CSS nativas) en `styles/colors.scss`. Al cambiar de tema desde el widget:

1. Se carga el JSON del nuevo tema.
2. Se genera un bloque CSS con todas las variables (`--primary`, `--base`, `--primary-rgb`, etc.).
3. Se inyecta vía `Gtk.CssProvider` con prioridad 900, que supera la prioridad de carga de AGS (800), sobreescribiendo los valores al instante.

Los colores del SCSS no usan variables de Sass (`$var`) — usan `var(--var)` directamente, lo que permite este override en runtime. Las variables de Sass solo se usan para valores fijos (tamaños, radios, fuentes).

## Crear un tema nuevo

1. Crea `themes/mi-tema.json` con las variables de color:

```json
{
  "name": "Mi Tema",
  "base": "#0a0a0f",
  "text": "#e0e0f0",
  "subtext0": "#a0a8c0",
  "surface0": "#10101a",
  "surface1": "#181828",
  "surface2": "#202035",
  "overlay0": "#1a1a30",
  "overlay1": "#252545",
  "primary": "#7b9fff",
  "primaryAlt": "#aabfff",
  "primaryMuted": "#4a6fd0",
  "danger": "#c06080",
  "warning": "#c0a060",
  "success": "#60a080",
  "info": "#80c0ff",
  "accent0": "#d0e0ff",
  "accent1": "#90b0ff",
  "accent2": "#b8d0ff",
  "accent3": "#f0f4ff",
  "mantle": "#060610",
  "crust": "#020208"
}
```

2. Agrega `wallpapers/mi-tema.png` (y opcionalmente `mi-tema.mp4` para fondo animado).
3. Selecciónalo desde el widget de AGS o con `echo "mi-tema" > current-theme && node build.js`.

## Tema de arranque sin contraseña (desde AGS)

Para que el widget de AGS pueda aplicar el tema de GRUB/Limine automáticamente al cambiar tema, necesitas una regla sudoers que permita ejecutar `build-boot.js` sin contraseña. `install.sh boot` la crea (validada con `visudo`); a mano:

```bash
sudo sh -c 'echo "emerson ALL=(ALL) NOPASSWD: /usr/bin/node /home/emerson/.config/shiro-theme/build-boot.js" > /etc/sudoers.d/shiro-boot && chmod 440 /etc/sudoers.d/shiro-boot'
```

Verifica que la ruta de Node coincida con tu sistema:

```bash
which node   # debe ser /usr/bin/node
```

La regla exige la ruta absoluta: `sudo -n node build-boot.js` desde la carpeta pide contraseña. Sin esta regla, el tema de arranque no se actualiza desde el widget (el resto del tema sí aplica). Siempre puedes aplicarlo manualmente con `sudo node ~/.config/shiro-theme/build-boot.js`.

## Requisitos

- Node.js
- AGS v3 (`ags`) con soporte GTK4/GJS
- Hyprland con `mpvpaper` (fondos de video) y/o `hyprpaper` (fondos estáticos)
- SDDM con el tema `shiro-sddm`
- GRUB o Limine para el tema de arranque (con systemd-boot no hay tema; los builders se omiten solos)
