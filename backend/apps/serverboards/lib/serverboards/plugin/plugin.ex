defmodule Serverboards.Plugin do
  defstruct name: nil,
            description: nil,
            author: nil,
            id: nil,
            version: nil,
            url: nil,
            enabled: true,
            tags: [],
            # status: ["disabled"],

            components: [],
            extra: %{},
            # set by parser/loader
            path: nil
end
