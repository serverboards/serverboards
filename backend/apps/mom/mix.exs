defmodule MOM.Mixfile do
  use Mix.Project

  def project do
    [app: :mom,
     version: "0.2.0",
     build_path: "../../_build",
     config_path: "../../config/config.exs",
     deps_path: "../../deps",
     lockfile: "../../mix.lock",
     elixir: "~> 1.2",
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     deps: deps]
  end

  # Configuration for the OTP application
  #
  # Type "mix help compile.app" for more information
  def application do
    [
      applications: [:logger],
      mod: {MOM, []}
    ]
  end

  defp descripton do
    """
    Message Oriented Middleware for Elixir
    """
  end

  defp package do
    [
      name: :mom,
      files: ["lib","test","mix.exs","README.md"],
      maintainers: ["David Moreno"],
      licenses: ["Apache-2.0"],
      links: %{
        "GitHub" => "https://github/serverboards/elixir-mom",
        "Serverboards" => "https://serverboards.io"
      }
    ]
  end

  defp deps do
    [
      { :uuid, "~> 1.1.3" }
    ]
  end
end
