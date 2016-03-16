require Logger

defmodule Serverboards.Auth do
	use Application

	defstruct []

	def start(_type, _args) do
		import Supervisor.Spec

		children = [
			supervisor(Serverboards.Auth.Repo, [])
		]
		opts = [strategy: :one_for_one, name: Serverboards.Auth.Supervisor ]
		Supervisor.start_link(children, opts)
	end
end

defimpl Serverboards.Peer, for: Serverboards.Auth do
	alias Serverboards.Auth.User

	def call(_, "auth", [email, password]) do
		User.auth(email, password)
	end

	def call(_, "set_password", [user, password]) do
		User.Password.set_password(user, password)
	end
end
