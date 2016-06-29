defmodule Test.User do
  def system do
    if Application.get_env(:serverboards, :debug, false) do
      Serverboards.Auth.User.user_info "dmoreno@serverboards.io", %{
        email: "dmoreno@serverboards.io"
      }
    else
      false
    end
  end
end
