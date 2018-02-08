const {React} = Serverboards
// const {colorize} = Serverboards.utils

function is_string(txt){
  return typeof(txt) == "string"
}

const COLORS = [
  "#a333c8",
  "#e03997",
  "#2185d0",
  "#00b5ad",
  "#b5cc18"
]

function colorize(index){
  return COLORS[index % COLORS.length]
}


const STOP_POINTS = [ 10000000, 1000000, 100000, 10000, 1000, 500, 100, 50, 10, 0, -1e100]

function next_stop_point(point){
  let prev = point
  for (const sp of STOP_POINTS){
    console.log("sp", sp, "point", point)
    if (sp < point)
      return prev
    prev = sp
  }
}

function get_data(expr){
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

const svg_style = {
  axis_bottom: {
    fill: "#000"
  },
  axis: {
    fill: "#9b9b9b"
  },
  grey: "#9b9b9b"

}


function SVGBars({data, xaxis, maxy, categories}){
  const xgap = 370.0 / xaxis.length // each categeory group width
  const xgap2 = ((xgap*3)/4)/categories.length // each category width
  const xgap4 = xgap2 / 2
  const xstart = 40 // where starts the  data
  const xstart2 = 40 + xgap2/2 // DELETE old mid line start
  console.log({xgap, xgap2, xstart, xstart2})

  // line colors
  const fill = categories.reduce( (acc, cat, i) => acc.concat(colorize(i)), [])

  function rescale(legend, category){
    const v = data[ [legend, category] ]
    // console.log("Rescale [%o,%o] %o => %o", legend, category, v, (v/maxy)*190.0)
    if (!v)
      return 0
    return (v/maxy)*190.0
  }

  console.log(fill)
  return (
    <svg height={250} width={400}>
      <g>
        <text x={30} y={25} textAnchor="end" fill={svg_style.grey}>{maxy}</text>
        <text x={30} y={75} textAnchor="end" fill={svg_style.grey}>{maxy*3/4}</text>
        <text x={30} y={125} textAnchor="end" fill={svg_style.grey}>{maxy*2/4}</text>
        <text x={30} y={175} textAnchor="end" fill={svg_style.grey}>{maxy/4}</text>
        <text x={30} y={225} textAnchor="end" fill={svg_style.grey}>0</text>
        <line x1={40} y1={220} x2={390} y2={220} style={svg_style.axis_bottom}/>
        {xaxis.map( (legend,i) => (
          <text x={xstart + i*xgap} y={235} style={svg_style.axis}>{legend}</text>
        ))}
      </g>
      <g>
        {xaxis.map( (legend,i) =>
          <g>
            {categories.map( (category, j) => {
              const x1 = xstart + i*xgap + j*xgap2
              const x2 = x1 + xgap2
              const y1 = 220
              const y2 = 220 - rescale(legend, category) - xgap4
              return (
                <g>
                  <path d={`M ${x1} ${y1} L ${x1} ${y2} A ${xgap4} ${xgap4} 0 0 1 ${x2} ${y2} L ${x2} ${y1} Z`} style={{fill: fill[j]}}/>
                </g>

              )
            } )}
          </g>
        ) }
      </g>
    </svg>
  )
}

class Bars extends React.Component {
  render(){
    const props = this.props
    const config = props.config

    console.log(config)

    const performance = get_data(config.performance)
    let performance_color = ""
    if (is_string(performance) && performance.startsWith('-'))
      performance_color = 'red'
    if (is_string(performance) && performance.startsWith('+'))
      performance_color = 'teal'

    const categories = Array.from(new Set(config.data.rows.map( r => r[0] )))
    const xaxis = Array.from(new Set(config.data.rows.map( r => r[1] ))).sort()
    const maxy = next_stop_point(config.data.rows.reduce( (acc, r) => Math.max(acc, Number(r[2])), 0 ))
    const data = config.data.rows.reduce( (acc, r) => {acc[ [r[1], r[0]] ] = Number(r[2]); return acc}, {})

    console.log(categories, xaxis, maxy, data)
    return (
      <div style={{display: "flex"}} className="ui padding">
        <div style={{flex: 1}}>
          <SVGBars data={data} xaxis={xaxis} maxy={maxy} categories={categories}/>
        </div>
        <div style={{flex: 0, minWidth: "8em", display: "flex", flexDirection: "column", alignItems: "flex-end"}}>
          <div className="ui biggier bold text padding bottom">{get_data(config.summary)}</div>
          <div className={`ui ${performance_color} text`}>{performance}</div>
          <div style={{flex: 1}}/>
          <div className="" style={{flex: 2, display: "flex", flexDirection: "column", justifyContent: "space-around"}}>
            {categories.map( (c, i) => (
              <div className="ui bold text">
                <span className={`ui square`} style={{background: colorize(i)}}/>&nbsp;
                {c}
              </div>
            ))}
          </div>
          <div style={{flex: 2}}/>
        </div>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/bars", Bars, {react: true})
