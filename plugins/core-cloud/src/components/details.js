const React = Serverboards.React
const i18n = Serverboards.i18n
const colorize = Serverboards.utils.colorize

function DL({data}){
  // console.log(data, data instanceof String, data instanceof Number, data instanceof Object, String(data))
  /*
  if (data instanceof String)
    return data
  if (data instanceof Number)
    return String(data)
  */
  if (data instanceof Object){
    return (
      <dd>
        {Object.keys(data).sort().map( k => (
          (data[k] == "None") ? (
            <dd className="ui grey text">{k}</dd>
          ) : (
          <dl key={k}>
            <dt>{k}</dt>
            <DL data={data[k]}/>
          </dl>
          )
        ) ) }
      </dd>
    )
  }
  return (
    <dd>{String(data)}</dd>
  )
}

function Details({vmc}){
  console.log(vmc)
  return (
    <div className="extend">
      <h2 className="ui centered header">{vmc.name}</h2>
      <div className="right">
        <span className="ui text label">
          {vmc.state}&nbsp;
          <i className={`ui rectangular label ${colorize(vmc.state)}`}/>
        </span>
      </div>
      <div className="ui extend with scroll and padding">
        <h3 className="ui teal header">{i18n("Data")}</h3>
        <DL data={vmc.props}/>
      </div>
    </div>
  )
}

export default Details
