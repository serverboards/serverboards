import {MiniBar} from './utils'

const {React, i18n} = Serverboards
const {Loading} = Serverboards.Components

function LeaderBars(props){
  const config = props.config
  if (!config || !config.data || config.data.loading)
    return (
      <Loading/>
    )
  if (config.data.error){
    return (
      <Error>{config.data.error}</Error>
    )
  }

  let maxrows = props.layout.h * 3

  const rows = config.data.rows.slice(0, maxrows)

  const p = 100.0 / rows.reduce( (acc, row) => acc + Number.parseFloat(row[1]), 0)
  return (
    <div className="ui" style={{display: "flex", justifyContent: "space-evenly", flexDirection: "column"}}>
      {rows.map( (row, i) => (
        <div key={[row, i]} style={{display: "flex", alignItems: "center"}}>
          <div className="ui small grey text" style={{padding: "0 1em"}}>{i + 1}</div>
          <div style={{flexGrow: 1, marginBottom: 10}}>
            <div className="ui bold text">{row[0]}</div>
            <MiniBar value={row[1] * p} color={row[2]}/>
          </div>
          <div style={{width: "5.5em", textAlign: "right", padding: "0 1em 0 0"}}>
            {(row[1] * p).toFixed(2)} %
          </div>
        </div>
      ))}
    </div>
  )
}


Serverboards.add_widget("serverboards.core.widgets/leaderbars", LeaderBars, {react: true})
