import {colorize} from './utils'
import GraphWithData from './graph_with_data'
const {React} = Serverboards

const svg_style = {
  axis_bottom: {
    fill: "#000"
  },
  axis_line: {
    stroke: "#aaa",
    strokeWidth: 0.5,
    vectorEffect: "non-scalling-stroke"
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
  // console.log({xgap, xgap2, xstart, xstart2})

  // line colors
  const fill = categories.reduce( (acc, cat, i) => acc.concat(colorize(i)), [])

  function rescale(legend, category){
    const v = data[ [legend, category] ]
    // console.log("Rescale [%o,%o] %o => %o", legend, category, v, (v/maxy)*190.0)
    if (!v)
      return 0
    return (v/maxy)*190.0
  }

  // console.log(fill)
  return (
    <svg height={250} width={400}>
      <g>
        <text x={25} y={25} textAnchor="end" fill={svg_style.grey}>{maxy}</text>
        <text x={25} y={75} textAnchor="end" fill={svg_style.grey}>{maxy*3/4}</text>
        <text x={25} y={125} textAnchor="end" fill={svg_style.grey}>{maxy*2/4}</text>
        <text x={25} y={175} textAnchor="end" fill={svg_style.grey}>{maxy/4}</text>
        <text x={25} y={225} textAnchor="end" fill={svg_style.grey}>0</text>

        <line x1={30} y1={20} x2={390} y2={20} style={svg_style.axis_line}/>
        <line x1={30} y1={70} x2={390} y2={70} style={svg_style.axis_line}/>
        <line x1={30} y1={120} x2={390} y2={120} style={svg_style.axis_line}/>
        <line x1={30} y1={170} x2={390} y2={170} style={svg_style.axis_line}/>
        <line x1={30} y1={220} x2={390} y2={220} style={svg_style.axis_bottom}/>


        <line x1={40} y1={220} x2={390} y2={220} style={svg_style.axis_bottom}/>
        {xaxis.map( (legend,i) => (
          <text key={i} x={xstart + i*xgap} y={235} style={svg_style.axis}>{legend}</text>
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

              const y1 = 220
              const y2 = 220 - dy
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
