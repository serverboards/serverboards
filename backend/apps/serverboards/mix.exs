defmodule Serverboards.Mixfile do
  use Mix.Project

  def project do
    [
      app: :serverboards,
      version: "18.10.0",
      build_path: "../../_build",
      config_path: "../../config/config.exs",
      deps_path: "../../deps",
      lockfile: "../../mix.lock",
      elixir: "~> 1.2",
      build_embedded: Mix.env() == :prod,
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      name: "Serverboards",
      homepage_url: "https://serverboards.io",
      docs: [
        logo: "docs/serverboards.png",
        extras: ["README.md"]
      ]
    ]
  end

  # Configuration for the OTP application
  #
  # Type "mix help compile.app" for more information
  def application do
    [
      applications: [
        :logger,
        :ecto,
        :postgrex,
        :comeonin,
        :mom,
        :timex,
        :yaml_elixir,
        :cowboy,
        :ranch,
        :eventsourcing,
        :uuid,
        :eini,
        :logger_journald_backend,
        :httpoison,
        :exosql
      ],
      mod: {Serverboards, []}
    ]
  end

  # Dependencies can be Hex packages:
  #
  #   {:mydep, "~> 0.3.0"}
  #
  # Or git/path repositories:
  #
  #   {:mydep, git: "https://github.com/elixir-lang/mydep.git", tag: "0.1.0"}
  #
  # To depend on another app inside the umbrella:
  #
  #   {:myapp, in_umbrella: true}
  #
  # Type "mix help deps" for more examples and options
  defp deps do
    [
      {:mom, in_umbrella: true},
      {:logger_journald_backend, git: "git://github.com/xerions/logger_journald_backend"},
      {:eventsourcing, in_umbrella: true},
      {:ecto, "~> 2.2"},
      {:postgrex, "~> 0.13"},
      {:comeonin, "~> 3.0"},
      {:timex, "~> 3.1"},
      {:poison, "~> 3.1"},
      {:yaml_elixir, "~> 2.0"},
      {:yamerl, "~> 0.3"},
      {:cowboy, "~> 1.1"},
      {:distillery, "~> 1.5", runtime: false},
      {:uuid, "~> 1.1"},
      {:eini, "~> 1.2"},
      {:httpoison, "~> 1.0"},
      {:exosql, "~> 0.2"},
      {:websockex, "~> 0.4.0"}
    ]
  end
end
