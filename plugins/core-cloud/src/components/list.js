const {React, cache, i18n} = Serverboards
import CloudCard from '../containers/card'
import DetailsTab from '../containers/detailstab'
const {Tip} = Serverboards.Components

class Future extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      value: undefined
    }
  }
  componentDidMount(){
    this.props.value.then( value => this.setState({value}) )
  }
  render(){
    return  (
      <span>
        {this.state.value || this.props.default}
      </span>
    )
  }
}

function SimpleList(props){
  const {items, current} = props
  return (
    <div className="ui cards">
    {items.map( i => (
      <CloudCard
        {...props}
        key={i.id}
        className={current && current.parent==i.parent && current.id==i.id && "selected"}
        item={i}
        onClick={() => props.setCurrent(i)}
        />
    ))}
    </div>
  )
}
function ByProviderList(props){
  const {items, current} = props
  return (
    <div>
      {Object.keys(items).map( provider => (
          <div key={provider}>
            <h3 className="ui teal header padding top">
              <Future value={cache.service(provider).then( p => p.name )} default="..."/>
            </h3>
            <SimpleList {...props} items={items[provider]}/>
          </div>
      ))}
    </div>
  )
}
class CheckBox extends React.Component{
  componentDidMount(){
    const {onChange} = this.props
    $(this.refs.el).checkbox({
      onChecked: () => onChange(true),
      onUnchecked: () => onChange(false)
    })
  }
  render(){
    const props = this.props
    return (
      <div className="ui checkbox" ref="el">
        <input type="checkbox" defaultChecked={props.value}/>
        <label>{props.label}</label>
      </div>
    )
  }
}

class ListView extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      show_filter_options: false
    }
  }
  render(){
    const props = this.props
    const {items, current} = this.props
    const {show_filter_options} = this.state

    let section
    if (current){
      section=(
        <DetailsTab key={current.id} vmc={current} reloadAll={props.reloadAll} />
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
              <div className="ui floating right menu">
                <a
                    className={`ui item ${show_filter_options ? "active" : null}`}
                    onClick={() => this.setState({show_filter_options: !show_filter_options})}
                    >
                  <i className="options icon"/>
                  <span className="ui small text">{i18n("Filters")}</span>
                </a>
              </div>
            </div>
            {show_filter_options && (
              <div className="ui shadow" style={{marginBottom: 3}}>
                <div className="ui secondary menu">
                  <a onClick={() => {console.log("close"); this.setState({show_filter_options: false})}} className="right item">
                    <i className="black close icon"/>
                  </a>
                </div>
                <div className="ui form with padding">
                  <CheckBox
                    label={i18n("Group by provider")}
                    value={props.by_provider}
                    onChange={props.setByProvider}
                    />
                </div>
              </div>
            )}
            <div className="ui scroll extend with padding">
              { items.length == 0 ? (
                <div className="ui meta">No items</div>
              ) : Array.isArray(items) ? (
                <SimpleList {...props}/>
              ) : (
                <ByProviderList {...props}/>
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
}

export default ListView
