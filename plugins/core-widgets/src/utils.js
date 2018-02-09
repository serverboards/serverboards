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

export function colorize(index){
  return COLORS[index % COLORS.length]
}

const STOP_POINTS = [ 10000000, 1000000, 100000, 10000, 1000, 500, 300, 200, 100, 75, 50, 25, 10, 0, -1e100]

export function next_stop_point(point){
  let prev = point
  for (const sp of STOP_POINTS){
    // console.log("sp", sp, "point", point)
    if (sp < point)
      return prev
    prev = sp
  }
}

export function get_data(expr){
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
    return String(expr.rows[0])
  }
  return String(expr)
}
