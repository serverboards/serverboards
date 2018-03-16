import {colorize} from './utils'
import GraphWithData from './graph_with_data'
const {React} = Serverboards

const svg_style = {
  axis_bottom: {
    fill: "#000"
  },
  axis_line: {
    fill: "#eee",
  },
  axis: {
    fill: "#9b9b9b"
  },
  grey: "#9b9b9b"
}

const style_dark = {
  axis_line: {
    fill: "#0e262b",
  },
}

function SVGBars({data, xaxis, maxy, categories, width, height, theme}){
  height = height + 0
  width = width + 0

  let style = svg_style
  if (theme == "dark")
    style = {...style, ...style_dark}

  const xstart = 40 // where starts the  data
  const xgap = ((width - xstart) / xaxis.length) // each categeory group width
  const xgap2 = (xgap*0.8) / categories.length // each bar width. A bit smaller than just divide the space
  const xgap4 = xgap2 / 2
  const xstart2 = 40 + xgap2/2 // DELETE old mid line start
  // console.log({xgap, xgap2, xstart, xstart2})
  const axisbottom = height - 20

  // line colors
  const fill = categories.reduce( (acc, cat, i) => acc.concat(colorize(i)), [])

  function rescale(legend, category){
    const v = data[ [legend, category] ]
    // console.log("Rescale [%o,%o] %o => %o", legend, category, v, (v/maxy)*190.0)
    if (!v)
      return 0
    return (v/maxy)*(height-40)
  }

  const p = (axisbottom - 10)
  const gridlines = [
    10,
    10 + 0.25 * p,
    10 + 0.5 * p,
    10 + 0.75 * p,
    axisbottom,
  ]

  // console.log(fill)
  // <line x1={40} y1={220} x2={390} y2={220} style={style.axis_bottom}/>
  return (
    <svg height={height} width={width}>
      <g>
        <text x={25} y={gridlines[0] + 5} textAnchor="end" fill={style.grey}>{maxy}</text>
        <text x={25} y={gridlines[1] + 5} textAnchor="end" fill={style.grey}>{maxy*3/4}</text>
        <text x={25} y={gridlines[2] + 5} textAnchor="end" fill={style.grey}>{maxy*2/4}</text>
        <text x={25} y={gridlines[3] + 5} textAnchor="end" fill={style.grey}>{maxy/4}</text>
        <text x={25} y={gridlines[4] + 5} textAnchor="end" fill={style.grey}>0</text>

        {gridlines.map( y => (
          <path d={`M 30 ${y} L ${width} ${y} L ${width} ${y-1} L 30 ${y-1} Z`} style={style.axis_line}/>
        ))}

        {xaxis.map( (legend,i) => (
          <text key={i} x={xstart + i*xgap} y={axisbottom + 15} style={style.axis}>{legend}</text>
        ))}
      </g>
      <g>
        {xaxis.map( (legend,i) =>
          <g key={i} >
            {categories.map( (category, j) => {
              let dy = Math.max(0, rescale(legend, category))
              if (dy == 0)
                dy=1  // Min 1 pix

              const x1 = xstart + i*xgap + j*xgap2
              const x2 = x1 + xgap2

              const y1 = axisbottom
              const y2 = axisbottom - dy
              if (dy < xgap4)
                return (
                  <path key={j} d={`M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2} L ${x2} ${y1} Z`} style={{fill: fill[j]}}/>
                )
              else{
                const y2_ = y2 + xgap4
                return (
                  <path key={j} d={`M ${x1} ${y1} L ${x1} ${y2_} A ${xgap4} ${xgap4} 0 0 1 ${x2} ${y2_} L ${x2} ${y1} Z`} style={{fill: fill[j]}}/>
                )
              }
            } )}
          </g>
        ) }
      </g>
    </svg>
  )
}


function Bars(props){
  return (
    <GraphWithData {...props} svgComponent={SVGBars}/>
  )
}

Serverboards.add_widget("serverboards.core.widgets/bars", Bars, {react: true})
