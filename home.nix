{ pkgs, inputs, ... }:

{
  imports = [
    inputs.caelestia-shell.homeManagerModules.default
    inputs.zen-browser.homeModules.beta
    ./caelestia/home.nix
  ];

  programs.caelestia = {
    enable = true;
    cli.enable = true;

    # The shell is started by the official `hypr/hyprland/execs.lua`
    # (`caelestia shell -d`). Keeping the Home Manager systemd unit would try
    # to start a second instance, and it never runs anyway because
    # `programs.hyprland.withUWSM` is disabled.
    systemd.enable = false;

    cli.settings.theme = {
      # GTK is managed by Home Manager (`gtk.*` below). Upstream would rewrite
      # the same dconf keys and `~/.config/gtk-*/gtk.css`, so keep it off to
      # avoid the two fighting over the same settings.
      enableGtk = false;

      # Upstream targets the Arch-only `qtengine`; this system uses `qt6ct`.
      enableQt = false;

      # Only theme the pieces this integration actually uses.
      enableTerm = true;
      enableHypr = true;
      enableFuzzel = true;
      enableBtop = true;
      enableDiscord = false;
      enableSpicetify = false;
      enablePandora = false;
      enableZed = false;
      enableWarp = false;
      enableChromium = false;
      enableCava = false;
      enableNvtop = false;
      enableHtop = false;
    };
  };

  # GTK is now managed declaratively. It used to be whatever Plasma wrote into
  # ~/.config/gtk-{3,4}.0 plus dconf.
  #
  # Note: with `programs.dconf.enable = true`, this also writes the
  # `org/gnome/desktop/interface` keys (theme, icons, cursor, font).
  gtk = {
    enable = true;

    font = {
      name = "Noto Sans";
      size = 10;
    };

    # GTK3 port of libadwaita. GTK4 apps ignore it and use Adwaita, but they
    # follow the dark preference below.
    theme = {
      name = "adw-gtk3-dark";
      package = pkgs.adw-gtk3;
    };

    # The official `gtk` component uses Papirus recoloured with
    # `papirus-folders`. `papirus-folders` cannot recolour store paths, so the
    # pre-recoloured Catppuccin Mocha variant is used instead (same icon names).
    iconTheme = {
      name = "Papirus-Dark";
      package = pkgs.catppuccin-papirus-folders;
    };

    # Same cursor as Hyprland (`cursorTheme` in caelestia/hypr-vars.lua), so
    # native Wayland and GTK apps agree.
    cursorTheme = {
      name = "Bibata-Modern-Ice";
      package = pkgs.bibata-cursors;
      size = 24;
    };

    colorScheme = "dark";
  };

  # Qt: the official `qt` component installs `qtengine` (Arch-only) and the
  # Darkly style. Here `qt6ct` plays that role: `QT_QPA_PLATFORMTHEME=qt6ct`
  # comes from `hypr/hyprland/env.lua`, and this writes its configuration.
  qt = {
    enable = true;

    style = {
      name = "Darkly";
      package = pkgs.darkly;
    };

    qt6ctSettings = {
      Appearance = {
        style = "Darkly";
        icon_theme = "Papirus-Dark";
        standard_dialogs = "xdgdesktopportal";
      };

      Fonts = {
        general = ''"Noto Sans,10"'';
        fixed = ''"Hack,10"'';
      };

      Interface.menus_have_icons = true;
    };
  };

  home.username = "nazukiss";
  home.homeDirectory = "/home/nazukiss";
  home.stateVersion = "26.05";

  xdg.autostart = {
    enable = true;

    entries = [
      "${pkgs.easyeffects}/share/applications/com.github.wwmm.easyeffects.desktop"
    ];
  };

  programs.home-manager.enable = true;

  home.packages = with pkgs; [
    unstable.opencode
    easyeffects
    gcc
    tree-sitter
    curl
    wget
    fd
    btop
    vscodium
    nixd
    nixfmt
    (python313.withPackages (ps: with ps; [
    ipykernel
    notebook
    jupyter
    mypy
    ]))
    vesktop
    lutris
    lsp-plugins
    zam-plugins
    calf
    mda_lv2
    kdePackages.kate
    gearlever
    appimage-run
  ];

  programs.git = {
    enable = true;

    settings = {
      user = {
        name = "nazukiss";
        email = "278974115+nazukiss@users.noreply.github.com";
      };

      init.defaultBranch = "main";
      core.editor = "nvim";
    };
  };

  programs.fish = {
    enable = true;

    # No prompt plugin: the official config initialises starship itself.
    shellAliases = {
      ne = "sudo nvim /etc/nixos/configuration.nix";
      nd = "sudo nvim /etc/nixos/desktop.nix";
      nhw = "sudo nvim /etc/nixos/hardware.nix";
      nsv = "sudo nvim /etc/nixos/services.nix";
      ng = "sudo nvim /etc/nixos/gaming.nix";
      np = "sudo nvim /etc/nixos/packages.nix";
      nh = "sudo nvim /etc/nixos/home.nix";
      ns = "sudo nixos-rebuild switch --flake /etc/nixos#nixos";
      nt = "sudo nixos-rebuild test --flake /etc/nixos#nixos";
      nb = "sudo nixos-rebuild build --flake /etc/nixos#nixos";
      nc = "cd /etc/nixos";
      nu = "cd /etc/nixos; sudo nix flake update; sudo nixos-rebuild switch --flake /etc/nixos#nixos";
    };

    # Official fish config (`caelestia/fish/config.fish`). It is inserted here
    # instead of linked because Home Manager generates `config.fish` itself.
    # The greeting lives in `fish/functions/fish_greeting.fish`.
    interactiveShellInit = builtins.readFile ./caelestia/fish/config.fish;
  };

  # The config itself is the official one, vendored in ./caelestia/fastfetch
  # and linked by ./caelestia/home.nix. This only installs the package.
  programs.fastfetch.enable = true;

  # Firefox chrome from the official dotfiles. The system already installs the
  # browser (`programs.firefox` in packages.nix), so only the profile is
  # managed here.
  programs.firefox = {
    enable = true;
    package = null;

    profiles.default = {
      id = 0;
      isDefault = true;

      # Firefox already created this profile; reuse it instead of creating a
      # new (empty) one and orphaning the existing bookmarks/history.
      path = "88dawb6p.default";

      userChrome = ./caelestia/firefox/userChrome.css;

      # `caelestia/firefox/user.js` only sets this preference.
      settings."toolkit.legacyUserProfileCustomizations.stylesheets" = true;
    };
  };

  # Zen Browser (Firefox-based). `beta` is Zen's stable channel; the flake
  # installs and wraps the official upstream build, and the module disables
  # Zen's own updater/telemetry by default (updates come from Nix).
  programs.zen-browser = {
    enable = true;

    profiles.default = {
      id = 0;
      isDefault = true;
    };
  };

  programs.neovim = {
    enable = true;
    defaultEditor = true;
    sideloadInitLua = true;

    # `nvim/colors/caelestia.lua` is vendored and linked by
    # ./caelestia/home.nix; this activates it. Written as `init.vim`, so a
    # future user `init.lua` would take precedence.
    extraConfig = ''
      colorscheme caelestia
    '';
  };

  programs.fzf = {
    enable = true;
    enableFishIntegration = true;
  };

  programs.ripgrep.enable = true;

  programs.lazygit = {
    enable = true;
    enableFishIntegration = true;
  };

  programs.kitty = {
    enable = true;
    themeFile = "Catppuccin-Mocha";
   
    font = {
      name = "JetBrainsMono Nerd Font";
      size = 12;
    };

    settings = {
      copy_on_select = "yes";
    };
  };
}
