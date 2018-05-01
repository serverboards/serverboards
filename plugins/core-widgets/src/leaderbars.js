import {MiniBar} from './utils'

const {React, i18n, utils} = Serverboards
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

  const rows = config.data.rows.slice(0, maxrows).map( r => [r[0], r[1], r[2], utils.to_number(r[1])])

  const p = 100.0 / rows.reduce( (acc, row) => acc + row[3], 0)
  let show_percent = (config.show == 'percent')
  const width = "5.5em"

  return (
    <div className="ui" style={{display: "flex", justifyContent: "space-evenly", flexDirection: "column"}}>
      {rows.map( (row, i) => (
        <div key={[row, i]} style={{display: "flex", alignItems: "center"}}>
          <div className="ui small grey text" style={{padding: "0 1em"}}>{i + 1}</div>
          <div style={{flexGrow: 1, marginBottom: 10}}>
            <div className="ui text" style={{marginBottom: 3}}>{row[0]}</div>
            <MiniBar value={row[3] * p} color={row[2]}/>
          </div>
          <div className="ui oneline text" style={{minWidth: width, textAlign: "right", padding: "0 1em 0 0"}}>
            { show_percent ? (
              <span>{(row[3] * p).toFixed(2)} %</span>
            ) : (
              row[1]
            )}
          </div>
        </div>
      ))}
    </div>
  )
}


Serverboards.add_widget("serverboards.core.widgets/leaderbars", LeaderBars, {react: true})
