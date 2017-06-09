const {React} = Serverboards
const random_color = Serverboards.utils.random_color

function find_service(service_id, services){
  return services.find(s => s.uuid == service_id) || {name: service_id}
}

function Action(props){
  const a = props.action
  return (
    <div className="card" style={{maxWidth: 200}} data-tooltip={a.description}>
      <a className="content" onClick={() => props.onRunAction(a)} style={{textAlign:"center"}}>
          <div style={{paddingTop: 20}}>
            <i className={`ui huge blue icon ${a.icon || "hand pointer"}`}/>
          </div>
          <div className="ui small header">
            {a.name}
          </div>
          <div>
            {a.service ? (
              <span className="ui meta">{find_service(a.service, props.services).name}</span>
            ) : null}
          </div>
      </a>
      <div className="extra content" style={{justifyContent: "flex-end", display: "flex"}}>
        <a onClick={(ev) => {ev.preventDefault(); props.onConfigureAction(a)}}>
          <i className="ui icon edit"/>
        </a>
      </div>
    </div>
  )
}

function View(props){
  const actions = (props.actions || []).sort( (a,b) => a.name.localeCompare(b.name) )
  return (
    <div>
      <div className="ui container" style={{paddingTop: 30}}>
        <div className="ui cards">
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
