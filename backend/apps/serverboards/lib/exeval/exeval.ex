require Logger

defmodule ExEval do
  def eval(expr), do: eval(expr, [])
  def eval(expr, context) do
      # Logger.info("Try parse #{inspect expr} with context #{inspect context}")

      tokens = tokenize(expr)
      # Logger.info("tokens #{inspect tokens}")
      {:ok, ast} = parse_ast(tokens)
      # Logger.info("ast #{inspect ast}")

      eval_ast(ast, context)
  end


  @all_expr_regex [
    {:ignore, ~r/^ /, :ignore},
    {:open_paren, ~r/^\(/, :ignore},
    {:close_paren, ~r/^\)/, :ignore},

    {:literal, ~r/^true/, true},
    {:literal, ~r/^false/, false},
    {:literal, ~r/^[0-9][0-9.]*/, :number},
    {:literal, ~r/^'[^']*'/, :string},
    {:literal, ~r/^"[^"]*"/, :string},

    {:unary_op, ~r/^not/, :not},

    {{:op, 6}, ~r/^or/, :or},
    {{:op, 5}, ~r/^and/, :and},
    {{:op, 4}, ~r/^\*/, :mul},
    {{:op, 3}, ~r/^\//, :div},
    {{:op, 2}, ~r/^\+/, :plus},
    {{:op, 2}, ~r/^-/, :minus},
    {{:op, 1}, ~r/^==/, :equal},
    {{:op, 1}, ~r/^!=/, :not_equal},

    {:var, ~r/^[a-z][a-z0-9.]*/i, :ignore},
  ]
  @max_op_pri 7

  @doc ~S"""
  tokenizes the expression.

  It returns a list of tokens, in which each is an identifier of the type, the
  original string and data dependant on the token type.
  [
    {:open_paren, "("},
    {:literal, "1", :number},
    {:operator, "+", :plus}
    {:literal, "2", :number},
    {:close_paren, ")"},
    {:operator, "*", :mul},
    {:literal, "3", 3}
  ]

  Spaces are ignored but used as token separators
  """
  def tokenize(""), do: []
  def tokenize(expr) do
    # Logger.debug("Tokenize: #{inspect expr}")
    token = which_token(expr, @all_expr_regex)
    {_, rest} = String.split_at(expr, String.length( elem(token, 1) ))
    case token do
      {:ignore, _, _} -> tokenize( rest )
      _ -> [token] ++ tokenize( rest )
    end
  end

  def which_token(expr, [{type, regex, extradata} | rest]) do
    # Logger.debug("which token: #{inspect expr} // #{inspect type}")
    case Regex.run(regex, expr) do
      nil -> which_token(expr, rest)
      [result] -> {type, result, extradata}
    end
  end

  @doc ~S"""
  The parse tree BNF is:

  ROOT = EXPR1[1]
  EXPR[pri] =
      EXPR[>pri] (OP[pri] EXPR[pri])*
    | UNARY_OP EXPR[pri]
  EXPR[max_pri] =
      LITERAL
    | ( EXPR[1]  )

  """
  def parse_ast(tokens) do
    {:ok, ast, []} = parse_expr(tokens, 1)
    {:ok, ast}
  end
  def parse_expr([{:literal, literal, type} | rest], @max_op_pri) do
    literal = parse_literal(literal, type)
    {:ok, {:literal, literal}, rest}
  end
  def parse_expr([{:var, literal, _} | rest], @max_op_pri) do
    {:ok, {:var, literal}, rest}
  end
  def parse_expr([{:open_paren, _, _} | rest], @max_op_pri) do
    {:ok, expr, [{:close_paren, _, _} | rest ]} = parse_expr(rest, 1)
    {:ok, expr, rest}
  end
  def parse_expr([{type, lit, _} | rest ], @max_op_pri) do
    {:error, {:invalid_token, type, lit}}
  end
  def parse_expr(tokens, pri) do
    {:ok, op1, rest} = parse_expr(tokens, pri+1)
    case rest do
      [ {{:op, ^pri}, _, op} | rest ] ->
        {:ok, op2, rest} = parse_expr(rest, pri)
        {:ok, {op, op1, op2}, rest}
      _ ->
        {:ok, op1, rest}
    end
  end
  def parse_expr([{:unary_op, _, :not} | rest], pri) do
    {:ok, ast, rest } = parse_expr(rest, pri)
    {:ok, {:not, ast}, rest}
  end

  def parse_literal(_, true), do: true
  def parse_literal(_, false), do: false
  def parse_literal(lit, :number) do
    {f, ""} = Float.parse(lit)
    f
  end
  def parse_literal(lit, :string) do
    # {f, ""} = Float.parse(lit)
    String.slice(lit, 1, String.length(lit) - 2)
  end


  def eval_ast({:literal, v}, context) do
    {:ok, v}
  end
  def eval_ast({:var, v}, context) do
    case get_var(String.split(v,"."), context) do
      {:error, :unknown_var} ->
        {:error, {:unknown_var, v, context}}
      other -> other
    end
  end
  def eval_ast({:equal, op1, op2}, context) do
    with {:ok, op1} <- eval_ast(op1, context),
         {:ok, op2} <- eval_ast(op2, context),
      do: {:ok, op1 == op2}
  end
  def eval_ast({:not_equal, op1, op2}, context) do
    with {:ok, op1} <- eval_ast(op1, context),
         {:ok, op2} <- eval_ast(op2, context),
      do: {:ok, op1 != op2}
  end
  def eval_ast({:or, op1, op2}, context) do
    with {:ok, op1} <- eval_ast(op1, context),
         {:ok, op2} <- eval_ast(op2, context),
      do: {:ok, op1 || op2}
  end
  def eval_ast({:and, op1, op2}, context) do
    with {:ok, op1} <- eval_ast(op1, context),
         {:ok, op2} <- eval_ast(op2, context),
      do: {:ok, op1 && op2}
  end
  def eval_ast({:plus, op1, op2}, context) do
    with {:ok, op1} <- eval_ast(op1, context),
         {:ok, op2} <- eval_ast(op2, context)
      do
        case op1 do
          op1 when is_number(op1) ->
            {:ok, op1 + op2}
          op1 when is_binary(op1) ->
            {:ok, op1 <> op2}
        end
    end
  end
  def eval_ast({:minus, op1, op2}, context) do
    with {:ok, op1} <- eval_ast(op1, context),
         {:ok, op2} <- eval_ast(op2, context),
      do: {:ok, op1 + op2}
  end
  def eval_ast({:mul, op1, op2}, context) do
    with {:ok, op1} <- eval_ast(op1, context),
         {:ok, op2} <- eval_ast(op2, context),
      do: {:ok, op1 * op2}
  end
  def eval_ast({:div, op1, op2}, context) do
    with {:ok, op1} <- eval_ast(op1, context),
         {:ok, op2} <- eval_ast(op2, context),
      do: {:ok, op1 / op2}
  end

  def get_var(_, []) do
    {:error, :unknown_var}
  end
  def get_var([], _) do
    {:error, :unknown_var}
  end
  def get_var([var], [ccontext | rest]) do
    case Map.get(ccontext, var, nil) do
      nil -> get_var([var],rest)
      other -> {:ok, other}
    end
  end
  def get_var([var | varrest] = fullvar, [ccontext | rest]) do
    case Map.get(ccontext, var, nil) do
      nil -> get_var(fullvar,rest)
      newcontext -> get_var(varrest, [newcontext])
    end
  end
end
