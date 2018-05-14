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
  0: "#a333c8",
  1: "#e03997",
  2: "#2185d0",
  3: "#00b5ad",
  4: "#b5cc18",
  5: "#b5cc18",
}

export const COLORNAMES = [
  "purple",
  "pink",
  "blue",
  "teal",
  "olive",
  "green"
]

export const PALETTES = {
  blue: [
    "#012D96",
    "#22ABBE",
    "#A4C6ED",
    "#008CD9",
    "#66A3E5",
    "#0A294D",
  ],
  purple:[
    "#9013FE",
    "#EF8BAC",
    "#DD248C",
    "#EF8BAC",
    "#420269",
    "#D394E0",
  ],
  green: [
    "#57814E",
    "#1E8A6A",
    "#00C25E",
    "#50E3C2",
    "#A3F18B",
    "#173337",
  ],
  brown:[
    "#DB9C63",
    "#753D3D",
    "#ED9445",
    "#B8703F",
    "#725B5B",
    "#3D1F04",
  ],
  mix: [
    "#a333c8",
    "#e03997",
    "#2185d0",
    "#00b5ad",
    "#b5cc18"
  ]
}

export function colorize(index, palette){
  const colors = PALETTES[palette] || PALETTES["purple"]
  return colors[index % colors.length]
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
