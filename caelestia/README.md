# Caelestia (dotfiles oficiales) en NixOS

Integración declarativa de las configuraciones oficiales de
[caelestia-dots/caelestia](https://github.com/caelestia-dots/caelestia) en este
sistema NixOS 26.05 + Home Manager.

- Repositorio de origen: <https://github.com/caelestia-dots/caelestia>
- Commit importado: `b476a36d4835e66ecee7695e0272b2c308788123` (2026-10-27)
- Shell/CLI: `caelestia-shell` vía el flake `github:caelestia-dots/shell`

## Estructura

| Ruta | Contenido |
| --- | --- |
| `hypr/` | Copia literal de `hypr/` del repo oficial (config Lua de Hyprland 0.55+). |
| `foot/foot.ini` | Copia literal de `foot/foot.ini`. |
| `fastfetch/config.jsonc` | Copia literal de `fastfetch/config.jsonc` (layout en caja, `logo: null`). |
| `fish/config.fish` | Copia literal; se inserta vía `programs.fish.interactiveShellInit`. |
| `fish/functions/fish_greeting.fish` | Copia literal, enlazada a `~/.config/fish/functions/`. |
| `starship.toml` | Copia literal, enlazada a `~/.config/starship.toml`. |
| `btop/btop.conf` | Copia literal, enlazada a `~/.config/btop/btop.conf`. |
| `thunar/` | `uca.xml` y `thunar-volman.xml`, enlazados a `~/.config/Thunar/`. |
| `nvim/` | `colors/caelestia.lua` y `lua/plugins/caelestia.lua`. |
| `firefox/userChrome.css` | CSS de Firefox; `user.js` solo aporta una preferencia. |
| `vscode/` | `settings.json`, `keybindings.json`, `flags.conf` y el VSIX de la integración. |
| `default.nix` | Módulo de sistema: keyring, ydotool/uinput, gpu-screen-recorder. |
| `home.nix` | Módulo de Home Manager: enlaza los archivos y aplica los parches. |

`configuration.nix` importa `./caelestia/default.nix` y `home.nix` importa
`./caelestia/home.nix`.

## Cómo se integra

- **Hyprland** carga `~/.config/hypr/hyprland.lua`, que a su vez hace
  `require()` de `hyprland/*.lua`, `variables.lua`, `utils/*.lua`,
  `scheme/current.lua` y, por último, `~/.config/caelestia/hypr-user.lua`.
- Los archivos se enlazan **uno por uno** (no el directorio completo) para que
  Hyprland y el CLI puedan seguir escribiendo `hypr/scheme/current.lua`.
- `hypr/scheme/default.lua` se enlaza; `current.lua` lo crea Hyprland al
  arrancar y luego lo regenera el CLI al cambiar de esquema.
- `~/.config/caelestia/hypr-vars.lua` y `hypr-user.lua` son archivos de
  override oficiales; se generan desde `home.nix` en lugar de editar el
  upstream.
- El servicio systemd de Home Manager para la shell está **desactivado**: la
  shell la arranca `hypr/hyprland/execs.lua` con `caelestia shell -d`, tal como
  indica el upstream (y `withUWSM` está desactivado en este sistema).

## Parches aplicados (solo los inevitables)

Los archivos originales **no** se editan en disco; las substituciones se hacen
en tiempo de evaluación de Nix (`builtins.replaceStrings`):

| Archivo | Original (Arch) | NixOS |
| --- | --- | --- |
| `hyprland/execs.lua` | `/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1` | `${pkgs.polkit_gnome}/libexec/...` |
| `hyprland/execs.lua` | `/usr/lib/geoclue-2.0/demos/agent` | `${pkgs.geoclue2}/libexec/geoclue-2.0/demos/agent` |
| `hyprland/keybinds.lua` | `qs -c caelestia kill` | `caelestia shell -k` |
| `hyprland/env.lua` | `QT_QPA_PLATFORMTHEME=qtengine` | `QT_QPA_PLATFORMTHEME=qt6ct` |

Overrides en `hypr-vars.lua` / `hypr-user.lua`:

- `cursorTheme = "Bibata-Modern-Ice"` — `sweet-cursors` no está en nixpkgs.
- `kbWindowFullscreen = "SUPER + SHIFT + F"` y
  `kbWindowBorderedFullscreen = "SUPER + F"` — se intercambiaron los atajos
  respecto al upstream: `SUPER + F` maximiza con borde y el fullscreen real
  queda en `SUPER + SHIFT + F`.
- `input.kb_layout = "es"` — el upstream usa `us`; el sistema usa `es`.
- `xwayland.use_nearest_neighbor = false` — Hyprland 0.55 usa nearest-neighbor
  por defecto para XWayland; se fuerza filtrado bilineal.
- `hl.monitor({ ... scale = 1.25 })` — el upstream usa `scale = 1`; las reglas
  de monitor se evalúan en orden y gana la última que coincide.

## Decisiones de integración

- **No** se habilita `wayland.windowManager.hyprland` de Home Manager: se usa la
  config Lua oficial con el `programs.hyprland` del sistema, evitando dos
  configuraciones generadas en conflicto.
- `qtengine` no existe en nixpkgs → `qt6ct` (`qt6Packages.qt6ct`). El plugin se
  encuentra gracias a `qt.enable` (declarado ahora en `desktop.nix`) y
  `QT_PLUGIN_PATH`.
- El CLI aplica tema GTK/Qt con `dconf` y `qtengine`; se desactivan
  (`theme.enableGtk = false`, `theme.enableQt = false`) porque GTK lo gestiona
  Home Manager (`gtk.*` en `home.nix`) y ambos escribirían las mismas claves de
  dconf.
- `sweet-cursors` → `bibata-cursors`.
- `fastfetch/config.jsonc` se importa tal cual: el CLI no lo reescribe, así que
  el symlink es seguro. Usa `logo: null` (sin logo) y módulos `command`
  (`uptime -p`, `free -m`, `hostnamectl hostname`, `echo $USER`), que existen
  en NixOS. Requiere una Nerd Font para los glifos. En `home.nix` solo queda
  `programs.fastfetch.enable = true` para instalar el paquete.
- No se importan `zed/`, `micro/`, `spicetify/`, `zen/` ni `uwsm/` (apps o
  gestores que este sistema no usa).

## Fish y prompt

- El prompt es **starship** (`~/.config/starship.toml` enlazado). Se eliminó el
  plugin `tide` de `programs.fish.plugins`.
- `fish/config.fish` **no se puede enlazar**: Home Manager genera ese archivo.
  Su contenido se inserta con
  `programs.fish.interactiveShellInit = builtins.readFile ./caelestia/fish/config.fish`.
  Eso aporta starship, direnv, zoxide, `ls` con eza, las abreviaturas de git y
  el `source` de `~/.config/caelestia/user-config.fish`.
- `fish/functions/fish_greeting.fish` sí se enlaza: muestra el logo ASCII y
  ejecuta `fastfetch`. Se quitó el `set -g fish_greeting` anterior.
- Se agregan `starship`, `eza`, `zoxide` y `direnv` (dependencias del upstream).

## btop, Thunar y nvim

- `btop/btop.conf` se enlaza y usa `color_theme = "caelestia"`. El CLI tiene
  `enableBtop = true`, así que regenera `~/.config/btop/themes/caelestia.theme`
  al cambiar de esquema (y hace `killall -USR2 btop`, de ahí `psmisc`).
  **Limitación:** el symlink es de solo lectura; los cambios hechos desde la UI
  de btop no se guardan.
- `Thunar/uca.xml` (acción "Open Terminal Here") y `Thunar/thunar-volman.xml`
  se enlazan. Thunar solo los reescribe si se editan desde su GUI; en ese caso
  el próximo rebuild los restaura (el original queda como `.hm-bak`).
- `nvim/colors/caelestia.lua` lee `~/.local/state/caelestia/scheme.json` en cada
  arranque, así que sigue el esquema sin intervención.
  `nvim/lua/plugins/caelestia.lua` es un spec de lazy.nvim: inofensivo si
  lazy.nvim no está instalado. El esquema se activa con `colorscheme caelestia`
  en `programs.neovim.extraConfig` (se escribe como `init.vim`; un futuro
  `init.lua` propio tendría prioridad).

## Firefox

- `programs.firefox` de Home Manager gestiona el perfil **existente**
  (`88dawb6p.default`, vía `profiles.default.path`), para no crear uno vacío ni
  dejar huérfanos marcadores/historial.
- `userChrome.css` se enlaza y `user.js` se reproduce con
  `settings."toolkit.legacyUserProfileCustomizations.stylesheets" = true`.
- `package = null`: el navegador ya lo instala `programs.firefox` del sistema
  (`packages.nix`).
- Home Manager reescribe `profiles.ini`; si Firefox lo modifica, el próximo
  rebuild lo restaura y deja el original como `.hm-bak`.
- No se importa la extensión nativa (`caelestiafox`) ni `packages/caelestia-firefox-theme`
  (PKGBUILD de Arch, requiere `/usr/lib/caelestia/`).

## Spotify / Spicetify

- Flake `github:Gerg-L/spicetify-nix` (sigue `nixpkgs-unstable`) y su módulo
  `homeManagerModules.spicetify`, importado en `home.nix`.
- Spotify y Spicetify se construyen **ya parcheados**: no hay `spicetify apply`
  manual. Cambiar tema, sub-tema o extensiones requiere rebuild.
- Tema: **SpicetifyCat** (`github:Adrien5902/SpicetifyCat`, rev
  `d9c98a8ba284593a2decc552ee706a4d1a6c8323`). Sub-temas: `Purple` (activo),
  `Summer_Sky`, `NyanCat`, `Stray`, `Love_is_War`.
- Extensiones: `adblockify` y `spicyLyrics` (archivo `spicy-lyrics.mjs`).
- `wayland = true`: Spotify arranca en Wayland nativo en vez de XWayland.
- `spotify` **no** está en `home.packages`; lo aporta `programs.spicetify`. Si
  se agrega aparte, ambos proveen `bin/spotify` y el perfil colisiona.
- `programs.caelestia.cli.settings.theme.enableSpicetify` sigue en `false`: el
  `color.ini` dinámico de Caelestia no lo lee `spicetify-nix`, y además el tema
  de SpicetifyCat y el de Caelestia son mutuamente excluyentes.

## VSCodium

- `VSCodium/User/settings.json`, `VSCodium/User/keybindings.json` y
  `codium-flags.conf` se enlazan.
- Se parchean dos rutas de Arch en `settings.json`:
  `/usr/lib/qt6/qml` → `${pkgs.qt6.qtdeclarative}/lib/qt-6/qml` y
  `/usr/bin/qmlls6` → `${pkgs.qt6.qtdeclarative}/bin/qmlls`.
- El tema `Caelestia` viene de la extensión oficial, que no está en el
  marketplace: el VSIX vendoreado se instala una sola vez desde
  `home.activation.caelestiaVscodeExtension` (`soramanew.caelestia-vscode-integration`).
- `settings.json` selecciona también el tema de iconos `catppuccin-mocha`, que
  requiere la extensión de iconos correspondiente (no instalada).

## GTK y Qt

- **GTK** lo gestiona Home Manager en `home.nix` (`gtk.enable = true`):
  tema `adw-gtk3-dark`, iconos `Papirus-Dark`, cursor `Bibata-Modern-Ice`
  (24 px), fuente Noto Sans 10 y `colorScheme = "dark"`.
- El componente `gtk` del upstream instala `adw-gtk-theme`, `papirus-icon-theme`
  y `papirus-folders`. Equivalencias:
  - `adw-gtk-theme` → `adw-gtk3`.
  - `papirus-icon-theme` + recolor con `papirus-folders` → **`catppuccin-papirus-folders`**
    (variante Mocha, mismos nombres de iconos). `papirus-folders` no puede
    recolorear rutas del store, y el CLI solo lo hace cuando `enableGtk = true`.
- Con `programs.dconf.enable = true`, Home Manager escribe además las claves de
  `org/gnome/desktop/interface`, así que dconf y `~/.config/gtk-{3,4}.0` quedan
  coherentes.
- **Qt** usa `qt6ct` (`QT_QPA_PLATFORMTHEME`, definido en `hypr/hyprland/env.lua`)
  con `qt.enable = true` para que el plugin esté en `QT_PLUGIN_PATH`.
  El componente `qt` del upstream (`qtengine` + `darkly-bin` + `frameworkintegration`)
  se traduce a:
  - `qtengine` → `qt6ct` con `qt.qt6ctSettings` (`style = "Darkly"`,
    `icon_theme = "Papirus-Dark"`, diálogos por portal).
  - `darkly-bin` → `pkgs.darkly` (Qt6) en `qt.style.package` y `QT_STYLE_OVERRIDE`.
  - `frameworkintegration` se omite: `darkly` de nixpkgs no lo necesita y
    arrastraría medio KDE Frameworks.
- Los archivos viejos que había escritos por Plasma y por el CLI de Caelestia
  (`settings.ini`, `gtk.css`, `colors.css`, `thunar.css`) se movieron a
  `~/.config/gtk-legacy-backup-2026-10-28/`.

## KDE Plasma retirado

`desktop.nix` ya no habilita `services.desktopManager.plasma6`. Como Plasma
aportaba cosas que otras partes usan, quedaron declaradas explícitamente:

| Opción | Antes (vía Plasma) | Ahora |
| --- | --- | --- |
| `qt.enable` | `plasma6.nix` | `desktop.nix` |
| `programs.gdk-pixbuf.modulePackages` | `librsvg` | `desktop.nix` |
| `fonts.packages` | `noto-fonts`, `hack-font` | `desktop.nix` |
| `fonts.fontconfig.defaultFonts` | Noto/Hack | `desktop.nix` |
| `services.displayManager.defaultSession` | `"plasma"` | `"hyprland"` |

- SDDM sigue igual (`sddm-astronaut` + `kdePackages.qtmultimedia`); no depende
  de Plasma.
- Portales que quedan: `xdg-desktop-portal-hyprland`, `xdg-desktop-portal-gtk`
  y el de `gnome-keyring`. Se pierde `xdg-desktop-portal-kde`/`kwallet`, que ya
  no hacen falta.
- `kdePackages.kate` se mantiene en `home.nix`: funciona sin Plasma. Se puede
  quitar si no se usa.

## Después del rebuild

1. Cerrar Firefox y Spotify antes del switch: Home Manager reescribe
   `~/.config/mozilla/firefox/profiles.ini` (el perfil debe estar inactivo) y
   reemplaza el paquete de Spotify (`spicetify-SpicetifyCat`).
2. Entrar a Hyprland desde SDDM.
3. Regenerar los colores para que `scheme/current.lua` coincida con el esquema
   que ya existe en `~/.local/state/caelestia/scheme.json`:

   ```sh
   caelestia scheme set -n catppuccin -f mocha
   ```

4. Opcional: borrar el archivo viejo `~/.config/hypr/scheme/current.conf`
   (formato anterior, ya no se usa con la config Lua).

## Dependencias / notas pendientes

- `ydotool` requiere cerrar y volver a iniciar sesión para que el grupo
  `ydotool` esté activo.
- Los archivos que Home Manager no gestionaba se respaldan como `<archivo>.hm-bak`
  (`home-manager.backupFileExtension` en `flake.nix`): `~/.gtkrc-2.0` ya se movió
  a `~/.config/gtk-legacy-backup-2026-10-28/`.
- El atajo de "pegar último portapapeles" (`CTRL + SHIFT + ALT + V`) depende de
  `ydotoold` + `/dev/uinput` (habilitados en `default.nix`).
- `sleepGestureCmd = "systemctl suspend-then-hibernate"` viene del upstream;
  requiere que la hibernación esté configurada (swap), si no, fallará.
- La regla de monitor oficial usa `scale = 1`; este equipo la sobreescribe a
  `1.25` desde `~/.config/caelestia/hypr-user.lua` (generado por `home.nix`).
- `gammastep` + agente de geoclue pueden pedir/necesitar ubicación; el agente
  oficial se lanza desde `execs.lua`.
