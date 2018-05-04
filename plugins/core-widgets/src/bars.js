import {colorize, get_legend} from './utils'
import GraphWithData from './graph_with_data'
const {React} = Serverboards

const svg_style = {
  axis_bottom: {
    fill: "#000"
  },
  axis_line: {
    fill: "rgba(155,155,155,0.1)",
  },
  axis: {
    fill: "#9b9b9b",
    fontSize: 12
  },
  axisy: {
    fill: "rgba(155,155,155,0.5)",
    fontSize: 12
  },
  grey: "rgba(155,155,155,0.5)"
}

function SVGBars({data, xaxis, maxy, categories, width, height, theme}){
  height = height + 0
  width = width + 0

  let style = svg_style

  const ylabelwidth = (Math.log10(maxy) * 10)
  const xstart = ylabelwidth + 10 // where starts the  data
  const xgap = ((width - xstart) / xaxis.length) // each categeory group width
  const xgap2 = (xgap*0.8) / categories.length // each bar width. A bit smaller than just divide the space
  const axisbottom = height - 20
  const imaxy = 1.0 / maxy
  const barw = Math.min(xgap2, 15)
  const barw2 = barw / 2
  const xstart2 = xstart +  (xgap2 - barw)/2
  const show_one_in = Math.ceil(xaxis.length / ((width - xstart) / 40))

  // line colors
  const fill = categories.reduce( (acc, cat, i) => acc.concat(colorize(i)), [])

  function rescale(legend, category){
    const v = data[ [legend, category] ]
    // console.log("Rescale [%o,%o] %o => %o", legend, category, v, (v*imaxy))
    if (!v)
      return 0
    return (v*imaxy)*(height-30)
  }

  const p = (axisbottom - 10)
  const gridlines = [
    10,
    Math.floor(10 + 0.25 * p),
    Math.floor(10 + 0.50 * p),
    Math.floor(10 + 0.75 * p),
    axisbottom,
  ]

  // console.log(fill)
  // <line x1={40} y1={220} x2={390} y2={220} style={style.axis_bottom}/>
  return (
    <svg height={height} width={width}>
      <g>
        <text x={ylabelwidth} y={gridlines[0] + 5} textAnchor="end" style={style.axisy}>{(maxy).toFixed(0)}</text>
        <text x={ylabelwidth} y={gridlines[1] + 5} textAnchor="end" style={style.axisy}>{(maxy*3/4).toFixed(0)}</text>
        <text x={ylabelwidth} y={gridlines[2] + 5} textAnchor="end" style={style.axisy}>{(maxy*2/4).toFixed(0)}</text>
        <text x={ylabelwidth} y={gridlines[3] + 5} textAnchor="end" style={style.axisy}>{(maxy/4).toFixed(0)}</text>
        <text x={ylabelwidth} y={gridlines[4] + 5} textAnchor="end" style={style.axisy}>0</text>

        {gridlines.map( y => (
          <path key={y} d={`M ${ylabelwidth + 5} ${y} L ${width} ${y} L ${width} ${y-1} L ${ylabelwidth + 5} ${y-1} Z`} style={style.axis_line}/>
        ))}

        {xaxis.map( (legend,i) => ( ((i % show_one_in) == 0) &&
          <text key={i} x={xstart + i*xgap + xgap2} y={axisbottom + 15} textAnchor="middle" style={style.axis}>{get_legend(legend)}</text>
        ))}
      </g>
      <g>
        {xaxis.map( (legend,i) =>
          <g key={i} >
            {categories.map( (category, j) => {
              let dy = Math.max(0, rescale(legend, category))
              if (dy == 0)
                dy=1  // Min 1 pix

              const x1 = xstart2 + i*xgap + j*xgap2
              const x2 = x1 + barw

              const y1 = axisbottom
              const y2 = axisbottom - dy
              if (dy < barw2)
                return (
                  <path key={j} d={`M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2} L ${x2} ${y1} Z`} style={{fill: fill[j]}}/>
                )
              else{
                const y2_ = y2 + barw2
                return (
                  <path key={j} d={`M ${x1} ${y1} L ${x1} ${y2_} A ${barw2} ${barw2} 0 0 1 ${x2} ${y2_} L ${x2} ${y1} Z`} style={{fill: fill[j]}}/>
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
