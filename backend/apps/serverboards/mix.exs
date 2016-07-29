defmodule Serverboards.Mixfile do
  use Mix.Project

  def project do
    [app: :serverboards,
     version: "0.3.0",
     build_path: "../../_build",
     config_path: "../../config/config.exs",
     deps_path: "../../deps",
     lockfile: "../../mix.lock",
     elixir: "~> 1.2",
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
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
      applications:       [
            :logger,
            :ecto,
            :postgrex,
            :comeonin,
            :mom,
            :timex,
            :yaml_elixir,
            :cowboy, :ranch,
            :exfswatch,
            :fs,
            :eventsourcing,
            :json
            ],
      mod: {Serverboards, []},
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
      {:mom, git: "git://github.com/serverboards/elixir-mom"},
      {:eventsourcing, in_umbrella: true},
      {:ecto, "~> 2.0"},
      {:postgrex, ">= 0.0.0"},
      {:comeonin, "~> 2.5"},
      {:timex, "~> 2.1.4"},
      {:json,  "~> 0.3.0"},
      {:yaml_elixir, "~> 1.0.0" },
      {:yamerl, github: "yakaz/yamerl" },
      {:cowboy, "~> 1.0"},
      {:exfswatch, "~> 0.1.0"},
      {:fs, "~> 0.9"},
      {:exrm, ">= 1.0.8"},
    ]
  end
end
