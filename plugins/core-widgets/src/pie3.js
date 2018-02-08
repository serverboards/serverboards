const React = Serverboards.React
const {colorize} = Serverboards.utils

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

function Pie3(props){
  const config = props.config
  return (
    <div className="ui with padding vertical split area">
      <h4 className="ui huge centered header">
        {get_data(config.summary, [0,0])}
      </h4>
      <div className="ui expand centered">
        {get_data(config.summary, [0,1])}
      </div>

      <table style={{width: "100%"}}>
        {config.data.rows.map( r => (
          <tr key={r[0]}>
            <td>
              <span className={`ui square ${colorize(r[0])}`}/>
              {r[0]}
            </td>
            <td className="ui big text">{r[1]} €</td>
            <td className="ui right aligned text">{r[2]}</td>
          </tr>
        ) ) }
      </table>
    </div>
  )
}

Serverboards.add_widget("serverboards.core.widgets/pie3", Pie3, {react: true})
