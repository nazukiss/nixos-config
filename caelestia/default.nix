# System-level integration for the official Caelestia dotfiles.
#
# Only the pieces that *must* live outside Home Manager are configured here;
# everything that belongs to the user (Hyprland config, shell settings, app
# configs) is handled by ./home.nix.
{ ... }:

{
  # `hypr/hyprland/execs.lua` starts `gnome-keyring-daemon --components=secrets`.
  # Enabling the NixOS service installs the daemon, exposes it on D-Bus and
  # wires the PAM module so the keyring can be unlocked at login.
  services.gnome.gnome-keyring.enable = true;

  # SDDM is the display manager on this system, so unlock the keyring there
  # as well (the module only enables it for `login` by default).
  security.pam.services.sddm.enableGnomeKeyring = true;

  # The official `CTRL + SHIFT + ALT + V` bind runs
  # `ydotool type -d 1 "$(cliphist ...)"`. ydotool needs the `ydotoold`
  # daemon and write access to /dev/uinput.
  programs.ydotool.enable = true;
  hardware.uinput.enable = true;
  users.users.nazukiss.extraGroups = [ "ydotool" ];

  # `caelestia record` (and the `CTRL + ALT + R` binds) use
  # gpu-screen-recorder. The NixOS module installs the setcap wrapper for
  # `gsr-kms-server`, which is required for promptless recording.
  programs.gpu-screen-recorder.enable = true;
}
