const {React, i18n} = Serverboards
import CloudCard from './card'

function ListView(props){
  const {items} = props

  return (
    <div className="ui expand two column grid grey background" style={{flexGrow:1, margin: 0}}>
      <div className="ui column">
        <div className="ui round pane white background">
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
                <CloudCard item={i}/>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="ui column">
        <div className="ui round pane white background">
        </div>
      </div>
    </div>
  )
}

export default ListView
