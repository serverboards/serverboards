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

  const rows = config.data.rows

  const p = 100.0 / rows.reduce( (acc, row) => acc + Number.parseFloat(row[1]), 0)
  return (
    <div className="ui" style={{display: "flex", justifyContent: "space-evenly", flexDirection: "column"}}>
      {rows.map( (row, i) => (
        <div key={[row, i]} style={{display: "flex", alignItems: "center"}}>
          <div className="ui small grey text with padding">{i}</div>
          <div style={{flexGrow: 1, marginBottom: 10}}>
            <div className="ui bold text">{row[0]}</div>
            <MiniBar value={row[1] * p}/>
          </div>
          <div className="ui padding" style={{width: "6em", textAlign: "right"}}>
            {(row[1] * p).toFixed(2)} %
          </div>
        </div>
      ))}
    </div>
  )
}


Serverboards.add_widget("serverboards.core.widgets/leaderbars", LeaderBars, {react: true})
