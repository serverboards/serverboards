const {React, i18n} = Serverboards
const colorize = Serverboards.utils.colorize

function CloudCard({item}){
  return (
    <div className="ui narrow card">
      <div className="header">
        <div className="right">
          <span className="ui text label">
            {item.state}&nbsp;
            <i className={`ui rectangular label ${colorize(item.state)}`}/>
          </span>
        </div>
      </div>
      <div className="ui padding">
        <h3 className="ui header">{item.name}</h3>
        <div className="ui meta">{item.description}</div>
        {item.type}
      </div>
    </div>
  )
}

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
