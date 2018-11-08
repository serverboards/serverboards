const React = Serverboards.React
const {map_get, colorize_hex} = Serverboards.utils

export function is_string(txt){
  return typeof(txt) == "string"
}

export function get_data(expr, path=[0,0], defval=""){
  if (expr == undefined || expr == null)
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
    return String(map_get(expr.rows, path, defval))
  }
  return String(expr)
}

const style = {
  bartop: {
    borderRadius: 100,
    background: "#d8d8d8",
    maxHeight: 6,
    minHeight: 6,
    position: "relative",
  },
  barin: {
    borderRadius: 100,
    display: "inline-block",
    maxHeight: 6,
    minHeight: 6,
    position: "absolute",
    left: 0,
    top: 0,

  }
}

export function MiniBar({value, color}){
  color = colorize_hex(color || "blue")
  return (
    <div style={style.bartop}>
      <div style={{...style.barin,
          background: color,
          minWidth: `${value}%`,
        }}/>
    </div>
  )
}

export function get_legend(legend){
  legend = String(legend)
  const pipe = legend.indexOf('|')
  if (pipe < 0)
    return legend
  return legend.split('|')[1]
}

const METRIC_SUFIX="kMGTPEZ"

export function display_number(number){
  if (number < 1)
    return number
  if (number < 10)
    return number.toFixed(1)
  if (number < 1000)
    return number.toFixed(0)
  for (const suf of METRIC_SUFIX){
    number= (number / 1000).toFixed(0)
    if (number<1000)
      return `${number}${suf}`
  }
  return `${number}Y` // Really... I dont think you had this big number.
}
