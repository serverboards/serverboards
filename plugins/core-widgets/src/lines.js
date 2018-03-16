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

function SVGLines({data, xaxis, maxy, categories, theme}){
  const xgap = 370.0 / xaxis.length // each categeory group width
  const xgap2 = ((xgap*3)/4)/categories.length // each category width
  const xgap4 = xgap2 / 2
  const xstart = 40 // where starts the  data
  const xstart2 = 40 + xgap2/2 // DELETE old mid line start
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
    return (v/maxy)*190.0
  }

  function get_line(category){
    const points = xaxis.map( (legend, j) => {
      const x = xstart + j*xgap + xgap2
      const y = 220 -  Math.max(0, rescale(legend, category))
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
    <svg height={250} width={400}>
      <g>
        <text x={25} y={25} textAnchor="end" fill={style.grey}>{maxy}</text>
        <text x={25} y={75} textAnchor="end" fill={style.grey}>{maxy*3/4}</text>
        <text x={25} y={125} textAnchor="end" fill={style.grey}>{maxy*2/4}</text>
        <text x={25} y={175} textAnchor="end" fill={style.grey}>{maxy/4}</text>
        <text x={25} y={225} textAnchor="end" fill={style.grey}>0</text>


        <path d="M 30 20 L 390 20 L 390 19 L 30 19 Z" style={style.axis_line}/>
        <path d="M 30 70 L 390 70 L 390 69 L 30 69 Z" style={style.axis_line}/>
        <path d="M 30 120 L 390 120 L 390 119 L 30 119 Z" style={style.axis_line}/>
        <path d="M 30 170 L 390 170 L 390 169 L 30 169 Z" style={style.axis_line}/>
        <path d="M 30 220 L 390 220 L 390 219 L 30 219 Z" style={style.axis_line}/>


        {xaxis.map( (legend,i) => show_category(i) && (
          <text key={i} x={xstart + i*xgap} y={235} style={style.axis}>{legend}</text>
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
