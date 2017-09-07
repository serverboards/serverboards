const {React, i18n} = Serverboards
import CloudCard from '../containers/card'
import Details from './details'

function ListView(props){
  const {items, current} = props

  let section
  if (current){
    section=(
      <Details vmc={current}/>
    )
  }
  else{
    section=null
  }

  return (
    <div className="ui expand two column grid grey background" style={{flexGrow:1, margin: 0}}>
      <div className="ui column extend">
        <div className="ui round pane white background extend">
          <div className="ui attached top form">
            <div className="ui input seamless white">
              <i className="icon search"/>
              <input type="text" onChange={(ev) => this.setFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
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
