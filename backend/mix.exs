defmodule Backend.Mixfile do
  use Mix.Project

  def project do
    [
      apps_path: "apps",
      build_embedded: Mix.env() == :prod,
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      version: "19.4.0-alpha2",
      name: "Serverboards",
      homepage_url: "https://serverboards.io",
      docs: [
        logo: "docs/serverboards.png",
        extras: ["README.md"]
      ]
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
  # Type "mix help deps" for more examples and options.
  #
  # Dependencies listed here are available only for this project
  # and cannot be accessed from applications inside the apps folder
  defp deps do
    [
      {:ex_doc, "~> 0.18.0", [env: :prod, hex: "ex_doc", repo: "hexpm", optional: false]},
      {:earmark, "~> 1.2"},
      {:distillery, "~> 1.5", runtime: false}
    ]
  end
end
