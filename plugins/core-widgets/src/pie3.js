import {get_data, COLORMAP, COLORNAMES} from './utils'
const {React, i18n} = Serverboards
const {colorize, object_is_equal, map_get} = Serverboards.utils
const {Loading, Error} = Serverboards.Components

const _2PI = Math.PI * 2
const CX = 75
const CY = 75
const R1 = 50
const R2 = 75

function SVGPie({center, rings, colors}){
  // console.log(colors, rings)
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
    <svg viewBox="0 0 150 150" style={{padding: "10px 30px"}}>
      <text x={CX} y={CY + 11} textAnchor="middle" style={{fontSize: 22, fontWeight: "bold"}}>{center}</text>
      {ringsp.map( (r,i) => (
        <path
          d={`M ${r[0]} A ${R1} ${R1} 0 ${r[4]} 1 ${r[1]} L ${r[2]} A ${R2} ${R2} 0 ${r[4]} 0 ${r[3]} Z`}
          style={{fill: COLORMAP[i] || colors[i]}}
          />
      ))}
    </svg>
  )
}

class Pie3 extends React.Component{
  componentDidMount(){
    this.props.setTitle(this.props.config.title)
  }
  componentWillReceiveProps(nextprops){
    if (map_get(nextprops, ["config","title"]) != map_get(this.props, ["config","title"]))
      this.props.setTitle(map_get(nextprops, ["config","title"]))
  }
  shouldComponentUpdate(nextprops){
    return !object_is_equal(nextprops.config, this.props.config)
  }
  render(){
    const config = this.props.config
    let rows = map_get(config,["data", "rows"])

    if (!rows)
      return (
        <Loading/>
      )

    rows = rows.sort( (a,b) => b[1] - a[1])

    if (rows.length>4){
      // max 4, if more, 3 + others
      console.log("rows", rows)
      const rest = rows.slice(3,1000).reduce((acc, row) => Number(row[1]) + acc, 0)
      console.log("rest", rest)
      rows=[
        rows[0],
        rows[1],
        rows[2],
        [i18n("Other"), rest, ""],
      ]

    }


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

        <table style={{width: "100%", lineHeight: "2.25em"}}>
          <tbody>
            {rows.map( (r,i) => (
              <tr key={r[0]}>
                <td className="ui ellipsis">
                  <span className={`ui square ${COLORNAMES[i]}`}/>
                  {r[0]}
                </td>
                <td className="ui big bold text right aligned">{r[1]} €</td>
                <td className={`ui right aligned text ${r[2] < 0 ? "red" : "teal"}`}>
                  {r[2]}
                </td>
              </tr>
            ) ) }
          </tbody>
        </table>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/pie3", Pie3, {react: true})
