defprotocol Serverboards.Peer do
	@moduledoc ~S"""
	Protocol to allow diferent types of peers, as websockets, tcp, or plugins.

	Every peer can then do some work to make a call and return the answer.

	Normally Peers are also a Serverboards.Router; a peer searchs for another
	proper peer on the router, and makes a call there.

	The full process can be done with Serverboards.call(router, method, params)
	"""
	def call(peer, method, params)
end


defmodule Serverboards do
	def call(peer, method, params) do
		 {:ok, router, rest} = Serverboards.Router.lookup(peer, method)
		 Peer.call(router, rest, params)
	end
end

defimpl Serverboards.Peer, for: Function do
	def call(peer, _, params) do
		 peer.(params)
	end
end
