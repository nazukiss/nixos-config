{
  description = "NixOS de nazukiss";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

    # Only used for individual packages through `pkgs.unstable.*`.
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";

    caelestia-shell = {
      url = "github:caelestia-dots/shell";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    home-manager = {
      url = "github:nix-community/home-manager/release-26.05";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Zen Browser is not packaged in nixpkgs. This flake wraps the official
    # upstream build and provides the Home Manager module used in home.nix.
    zen-browser = {
      url = "github:0xc000022070/zen-browser-flake";
      inputs = {
        nixpkgs.follows = "nixpkgs";
        home-manager.follows = "home-manager";
      };
    };

    # Declarative Spotify: the theme and extensions are applied at build time
    # (no manual `spicetify apply`). Follows nixpkgs-unstable because the flake
    # is still experimental; Spotify and the CLI come from the system nixpkgs.
    spicetify-nix = {
      url = "github:Gerg-L/spicetify-nix";
      inputs.nixpkgs.follows = "nixpkgs-unstable";
    };
  };

  outputs = inputs@{ self, nixpkgs, home-manager, ... }: {
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      modules = [
        ./configuration.nix

        home-manager.nixosModules.home-manager

        {
          # Exposes `pkgs.unstable.<pkg>` without moving the whole system to
          # nixos-unstable.
          nixpkgs.overlays = [
            (final: prev: {
              unstable = import inputs.nixpkgs-unstable {
                system = final.stdenv.hostPlatform.system;
                config.allowUnfree = true;
              };
            })
          ];

          home-manager.useGlobalPkgs = true;
          home-manager.useUserPackages = true;

          # Files created outside Home Manager (Plasma, the Caelestia CLI, ...)
          # are moved to `<file>.hm-bak` instead of aborting the activation.
          home-manager.backupFileExtension = "hm-bak";

          home-manager.users.nazukiss = import ./home.nix;
          home-manager.extraSpecialArgs = { inherit inputs; };
        }
      ];
    };
  };
}
