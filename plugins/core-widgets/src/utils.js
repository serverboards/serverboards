const React = Serverboards.React
const {map_get} = Serverboards.utils

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
  if (!color)
    color = COLORMAP[color] || COLORMAP["blue"]
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
  const pipe = legend.indexOf('|')
  if (pipe < 0)
    return legend
  return legend.split('|')[1]
}
