defprotocol Serverboards.Router.Port do
	@moduledoc ~S"""
	Defines the basic communication protocol between the Rotuer.Peer s and the
	router itself.

	It just is able to read and write messages, that will have the
	Serverboards.Router.Message struct type.

	read_msg will block until new message is available which can be a new RPC call,
	a response, a RPC notification...
	"""
	def write_msg(port, msg)
	def read_msg(port)
end
