const {React} =  Serverboards
import {colorize} from './utils'
import GraphWithData from './graph_with_data'

const svg_style = {
  axis_bottom: {
    stroke: "#333",
    strokeWidth: 1,
    vectorEffect: "non-scalling-stroke"
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

function SVGLines({data, xaxis, maxy, categories, width, height, theme}){
  height = height + 0
  width = width + 0

  const xgap = width / (xaxis.length-0.5) // each categeory group width
  const xgap2 = ((xgap*3)/4)/categories.length // each category width
  const xgap4 = xgap2 / 2
  const xstart = 40 // where starts the  data
  const xstart2 = 40 + xgap2/2 // DELETE old mid line start
  const ygap = (height / 5)
  const ystart = (ygap / 2) - 5
  const yend = ystart + 4*ygap
  const yscale = (yend - ystart)
  // console.log({xgap, xgap2, xstart, xstart2})

  let style = svg_style
  if (theme == "dark")
    style = {...style, ...style_dark}

  // line colors
  const fill = categories.reduce( (acc, cat, i) => acc.concat(colorize(i)), [])

  function rescale(legend, category){
    const v = data[ [legend, category] ]
    // console.log("Rescale [%o,%o] %o => %o", legend, category, v, (v/maxy)*190.0)
    if (!v)
      return 0
    return (v/maxy)*yscale
  }

  function get_line(category){
    const points = xaxis.map( (legend, j) => {
      const x = xstart + j*xgap
      const y = yend -  Math.max(0, rescale(legend, category))
      return `${x} ${y}`
    })
    const ret = points.join(' ')
    // console.log(`${category} ${ret}`)
    return ret
  }

  const show_one_in = Math.ceil(xaxis.length / 10.0)
  function show_category(i){
    // console.log("Show %d? %d", i, (i % show_one_in) == 0)
    return (i % show_one_in) == 0
  }
  // console.log("Show one cat in %d", show_one_in)

  // console.log(fill)
  return (
    <svg height={height} width={width}>
      <g>
        <text x={25} y={ystart+5} textAnchor="end" fill={style.grey}>{maxy}</text>
        <text x={25} y={ystart+5+ygap} textAnchor="end" fill={style.grey}>{maxy*3/4}</text>
        <text x={25} y={ystart+5+2*ygap} textAnchor="end" fill={style.grey}>{maxy*2/4}</text>
        <text x={25} y={ystart+5+3*ygap} textAnchor="end" fill={style.grey}>{maxy/4}</text>
        <text x={25} y={ystart+5+4*ygap} textAnchor="end" fill={style.grey}>0</text>


        <path d={`M 30 ${ystart}        L ${width - 10} ${ystart}        L ${width - 10} ${ystart-1}        L 30 ${ystart-1}        Z`} style={style.axis_line}/>
        <path d={`M 30 ${ystart+ygap}   L ${width - 10} ${ystart+ygap}   L ${width - 10} ${ystart+ygap-1}   L 30 ${ystart+ygap-1}   Z`} style={style.axis_line}/>
        <path d={`M 30 ${ystart+2*ygap} L ${width - 10} ${ystart+2*ygap} L ${width - 10} ${ystart+2*ygap-1} L 30 ${ystart+2*ygap-1} Z`} style={style.axis_line}/>
        <path d={`M 30 ${ystart+3*ygap} L ${width - 10} ${ystart+3*ygap} L ${width - 10} ${ystart+3*ygap-1} L 30 ${ystart+3*ygap-1} Z`} style={style.axis_line}/>
        <path d={`M 30 ${ystart+4*ygap} L ${width - 10} ${ystart+4*ygap} L ${width - 10} ${ystart+4*ygap-1} L 30 ${ystart+4*ygap-1} Z`} style={style.axis_line}/>


        {xaxis.map( (legend,i) => show_category(i) && (
          <text key={i} x={xstart + i*xgap} y={ystart+15+4*ygap} style={style.axis}>{legend}</text>
        ))}
      </g>
      <g>
        {categories.map( (category,i) => (
          <polyline key={category} points={get_line(category)} style={{stroke: fill[i], fill: "none", strokeWidth: 2}}/>
        ) ) }
      </g>
    </svg>
  )
}

function Lines(props){
  return (
    <GraphWithData {...props} svgComponent={SVGLines}/>
  )
}

Serverboards.add_widget("serverboards.core.widgets/lines", Lines, {react: true})
