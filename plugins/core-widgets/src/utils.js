const React = Serverboards.React
const {map_get} = Serverboards.utils

export function is_string(txt){
  return typeof(txt) == "string"
}

export const COLORS = [
  "#a333c8",
  "#e03997",
  "#2185d0",
  "#00b5ad",
  "#b5cc18"
]

export const COLORMAP = {
  purple: "#a333c8",
  pink: "#e03997",
  blue: "#2185d0",
  teal: "#00b5ad",
  olive: "#b5cc18",
  green: "#b5cc18",
}

export function colorize(index){
  return COLORS[index % COLORS.length]
}

export function get_data(expr, path=[0,0]){
  if (!expr)
    return ""
  if (expr.loading){
    return (
      <i className="ui loading spinner icon"/>
    )
  }
  if (expr.error){
    return (
      <span className="ui centered expand" title={String(expr.error)}>
        <i className="icon warning sign" style={{color: "yellow"}}/>
      </span>
    )
  }
  else if (expr.rows){
    return String(map_get(expr.rows, path))
  }
  return String(expr)
}
