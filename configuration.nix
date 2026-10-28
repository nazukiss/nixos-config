{ pkgs, ... }:

{
  imports = [
    ./hardware-configuration.nix
    ./desktop.nix
    ./hardware.nix
    ./services.nix
    ./packages.nix
    ./snapshots.nix
    ./caelestia/default.nix
  ];

  # Boot
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Zen kernel from nixpkgs-unstable (7.2.x). The NVIDIA open modules and
  # lenovo-legion-module also come from this package set, because the ones in
  # nixos-26.05 (NVIDIA 595.71.05) do not build against kernel 7.2.
  boot.kernelPackages = pkgs.unstable.linuxPackages_zen;

  # Networking
  networking.hostName = "nixos";
  networking.networkmanager.enable = true;

  # Locale
  time.timeZone = "America/Argentina/Buenos_Aires";

  i18n.defaultLocale = "es_AR.UTF-8";

  i18n.extraLocaleSettings = {
    LC_ADDRESS = "es_AR.UTF-8";
    LC_IDENTIFICATION = "es_AR.UTF-8";
    LC_MEASUREMENT = "es_AR.UTF-8";
    LC_MONETARY = "es_AR.UTF-8";
    LC_NAME = "es_AR.UTF-8";
    LC_NUMERIC = "es_AR.UTF-8";
    LC_PAPER = "es_AR.UTF-8";
    LC_TELEPHONE = "es_AR.UTF-8";
    LC_TIME = "es_AR.UTF-8";
  };

  console.keyMap = "es";

  # User
  users.users.nazukiss = {
    isNormalUser = true;
    description = "Nazukiss";
    shell = pkgs.fish;

    extraGroups = [
      "networkmanager"
      "wheel"
    ];
  };

  # Nix
  nix.settings.experimental-features = [
    "nix-command"
    "flakes"
  ];

  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 30d";
  };

  programs.appimage = {
    enable = true;
    binfmt = true;
  };

  nix.optimise.automatic = true;

  nixpkgs.config.allowUnfree = true;

  system.stateVersion = "26.05";
}
