const React = Serverboards.React
const i18n = Serverboards.i18n

function Details({vmc}){
  console.log(vmc)
  return (
    <div>
      <h2 className="ui centered header">{vmc.name}</h2>
      <div>
        <h3 className="ui teal header">{i18n("Data")}</h3>
        {Object.keys(vmc.props).map( k => (
          <dl>
            <dt>{k}</dt>
            <dd>{vmc.props[k]}</dd>
          </dl>
        ))}
      </div>
    </div>
  )
}

export default Details
