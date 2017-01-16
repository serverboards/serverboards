const {React} = Serverboards
const random_color = Serverboards.utils.random_color

function find_service(service_id, services){
  return services.find(s => s.uuid == service_id) || {name: service_id}
}

function Action(props){
  const a = props.action
  return (
    <div className="column" data-tooltip={a.description}>
      <a onClick={() => props.onRunAction(a)} className={`ui big top attached button ${random_color(a.service || "a")} labeled icon`}>
        {a.icon ? (
          <i className={`ui icon ${a.icon}`}/>
        ) : null}
        {a.name}
      </a>
      <a onClick={() => props.onConfigureAction(a)} className="ui bottom attached icon button" style={{maxWidth: "3em", display: "inline-block"}}>
        <i className="ui icon settings"/>
      </a>
      {a.service ? (
        <span style={{paddingLeft: 10}}>{find_service(a.service, props.services).name}</span>
      ) : null}
    </div>
  )
}

function View(props){
  const actions = (props.actions || []).sort( (a,b) => a.name.localeCompare(b.name) )
  return (
    <div>
      <div className="ui top header menu">
        <h4>Actions</h4>
      </div>
      <div className="ui container" style={{paddingTop: 30}}>
        <div className="ui four column grid stackable">
          {(actions || []).map( (a) => (
            <Action key={a.id} action={a} {...props}/>
          ))}
        </div>
      </div>
      <a onClick={props.onOpenAddAction} className="ui massive button _add icon floating yellow">
        <i className="add icon"></i>
      </a>
    </div>
  )
}

export default View
