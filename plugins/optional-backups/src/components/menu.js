const {i18n, React, store} = Serverboards

function BackupMenu(props){
  const location = store.getState().routing.locationBeforeTransitions.pathname
  return (
    <div className="menu">
      <span className="item stretch"/>
      {location.endsWith("/add") ? (
        <a className="ui button" onClick={ () => store.goto(location.slice(0, location.length-3)) }>
          {i18n("Back to list")}
        </a>
      ) : (
        <a className="ui button teal" onClick={ () => store.goto(location+"add") }>
          {i18n("Add backup job")}
        </a>
      )}
    </div>
  )
}


export default BackupMenu
