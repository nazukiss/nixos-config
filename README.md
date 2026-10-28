# NixOS Configuration

Configuración personal de NixOS, gestionada de forma declarativa con Nix Flakes.

## Overview

- **OS:** NixOS
- **Desktop:** Hyprland + Caelestia
- **Shell:** Fish
- **Package management:** Nix Flakes
- **Focus:** reproducibilidad, personalización y un entorno Linux adaptado a mis necesidades.

## Repository structure

```text
.
├── flake.nix
├── flake.lock
├── configuration.nix
├── hardware.nix
├── hardware-configuration.nix
├── desktop.nix
├── home.nix
├── packages.nix
├── services.nix
├── snapshots.nix
├── caelestia/
│   ├── hypr/
│   ├── fish/
│   ├── firefox/
│   ├── foot/
│   └── fastfetch/
├── site/
└── .github/workflows/
```

## Website

La web del proyecto se encuentra en `site/` y se publica mediante GitHub Actions.

Cuando GitHub Pages esté activado, estará disponible en:

https://nazukiss.github.io/nixos-config/

## Apply configuration

Antes de aplicar cambios en tu sistema, revisá los archivos modificados. Si usás la configuración basada en flakes desde este directorio, podés validar primero con:

```bash
sudo nixos-rebuild dry-build --flake /etc/nixos#nixos
```

El nombre `nixos` debe coincidir con el nombre real de tu host definido en `flake.nix`.

## Notes

- Revisá los módulos y los paquetes antes de reconstruir el sistema.
- No publiques contraseñas, tokens, claves privadas ni otros secretos.
- La configuración de hardware puede ser específica de una máquina.

## License

No se ha especificado una licencia para este repositorio.
