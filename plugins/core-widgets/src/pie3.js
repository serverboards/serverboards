const React = Serverboards.React
const {colorize, object_is_equal, map_get} = Serverboards.utils
const {Loading, Error} = Serverboards.Components

const COLORS = {
  purple: "#a333c8",
  pink: "#e03997",
  blue: "#2185d0",
  teal: "#00b5ad",
  olive: "#b5cc18",
  green: "#b5cc18",
}


function get_data(expr, path=[0,0]){
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
    return String(Serverboards.utils.map_get(expr.rows, path))
  }
  return String(expr)
}

const _2PI = Math.PI * 2
const CX = 75
const CY = 75
const R1 = 50
const R2 = 75


function SVGPie({center, rings, colors}){
  console.log(colors, rings)
  const maxs = rings.reduce( (x,acc) => x + acc, 0)
  if (maxs == 0){
    return null
  }
  const sc = _2PI / maxs
  let prev = [`${CX} ${CY - R1}`, `${CX} ${CY - R2}`]
  let acc = -Math.PI/2
  const ringsp = rings.map( ring =>{
    const a = ring * sc
    console.log(acc, a, ring / maxs)
    acc += a
    const next = [
      `${CX + Math.cos(acc) * R1} ${CY + Math.sin(acc) * R1}`,
      `${CX + Math.cos(acc) * R2} ${CY + Math.sin(acc) * R2}`,
    ]
    const ret = [
      prev[0], next[0], next[1], prev[1], ((a>3.14) ? 1 : 0),
    ]
    prev = next
    return ret
  })

  console.log(ringsp)

  return (
    <svg viewBox="0 0 150 150" style={{padding: 30}}>
      <text x={CX} y={CY + 11} textAnchor="middle" style={{fontSize: 22, fontWeight: "bold"}}>{center}</text>
      {ringsp.map( (r,i) => (
        <path
          d={`M ${r[0]} A ${R1} ${R1} 0 ${r[4]} 1 ${r[1]} L ${r[2]} A ${R2} ${R2} 0 ${r[4]} 0 ${r[3]} Z`}
          style={{fill: COLORS[colors[i]] || colors[i]}}
          />
      ))}
    </svg>
  )
}

class Pie3 extends React.Component{
  shouldComponentUpdate(nextprops){
    return !object_is_equal(nextprops.config, this.props.config)
  }
  render(){
    const config = this.props.config
    const rows = map_get(config,["data", "rows"])

    if (!rows)
      return (
        <Loading/>
      )

    let rings
    try{
      rings = rows.map( r => Number(r[1]))
    } catch (e) {
      return (
        <Error>
          {i18n("Invalid data for pie chard. Second column must be numbers")}
        </Error>
      )
    }


    return (
      <div className="ui with padding vertical split area">
        <div className="ui huge centered text" style={{fontSize: 48}}>
          {get_data(config.summary, [0,0])}
        </div>
        <div className="ui expand centered">
          <SVGPie
            center={get_data(config.summary, [0,1])}
            rings={rings}
            colors={rows.map( r => colorize(r[0]))}/>
        </div>

        <table style={{width: "100%", lineHeight: "2.5em"}}>
          {rows.map( r => (
            <tr key={r[0]}>
              <td>
                <span className={`ui square ${colorize(r[0])}`}/>
                {r[0]}
              </td>
              <td className="ui big bold text">{r[1]} €</td>
              <td className={`ui right aligned text ${r[2] < 0 ? "red" : "teal"}`}>
                {r[2]}
              </td>
            </tr>
          ) ) }
        </table>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/pie3", Pie3, {react: true})
