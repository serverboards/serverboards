const {React, i18n} = Serverboards
import CloudCard from '../containers/card'
import Details from './detailstab'
const {Tip} = Serverboards.Components

function ListView(props){
  const {items, current} = props

  let section
  if (current){
    section=(
      <Details key={current.id} vmc={current} reloadAll={props.reloadAll} />
    )
  }
  else{
    section=(
      <Tip
        subtitle={i18n("Direct access to your Virtual Machines and Containers.")}
        description={i18n("Add access to your Virtual Machine and Containers and access directly from the UI via a SSH Terminal or Remote Desktop.")}
        />
    )
  }

  return (
    <div className="ui expand two column grid grey background" style={{flexGrow:1, margin: 0}}>
      <div className="ui column extend">
        <div className="ui round pane white background extend">
          <div className="ui attached top form">
            <div className="ui input seamless white">
              <i className="icon search"/>
              <input type="text" onChange={(ev) => props.setFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
            </div>
          </div>
          <div className="ui scroll extend with padding">
            { items.length == 0 ? (
              <div className="ui meta">No items</div>
            ) : (
              <div className="ui cards">
              {items.map( i => (
                <CloudCard
                  {...props}
                  className={current && current.parent==i.parent && current.id==i.id && "selected"}
                  item={i}
                  onClick={() => props.setCurrent(i)}
                  />
              ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="ui column">
        <div className="ui round pane white background">
          {section}
        </div>
      </div>
    </div>
  )
}

export default ListView
