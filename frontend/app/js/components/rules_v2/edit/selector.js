import React from 'react'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Icon from '../../iconicon'

function Card({item}){
  const plugin = item.plugin_id || (item.type && item.type.split('/')[0])
  const icon = item.icon || ""
  return (
    <a className="ui card" style={{padding: 5}}>
      <h3 className="ui header">
        <Icon className="mini" icon={icon} plugin={plugin}/>
        {item.name}
      </h3>
      <div className="description">{item.description}</div>
    </a>
  )
}

class Selector extends React.Component{
  constructor(props){
    super(props)
    this.state={
      tab: "cloud",
      items: [],
      filter: ""
    }
    this.setTab = (tab) => this.setState({tab})
    this.onFilter = (filter) => {
      this.setState({filter})
      if (filter!=""){
        this.setState({tab:"filter"})
      }
      else{
        this.setState({tab:"cloud"})
      }
    }
  }
  componentDidMount(){
    this.props.get_items().then( catalog => {
      catalog=catalog.slice().sort( (a,b) => a.name.localeCompare(b.name) )
      console.log(catalog)
      this.setState({items: catalog})
    } )
  }
  render(){
    const props = this.props
    const tab = this.state.tab
    let filtered = this.state.items

    switch(tab){
      case "other":
        filtered = filtered.filter( s => s.traits.indexOf("server")==-1 && s.traits.indexOf("cloud")==-1 )
        break;
      case "filter":
        let filter = this.state.filter
        filtered = filtered.filter( s => (
          (s.name || "").toLocaleLowerCase().includes(filter.toLocaleLowerCase()) ||
          (s.description || "").toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ) )
        break;
      default:
        filtered = filtered.filter( s => s.traits.indexOf(tab)>=0 )
        break;
    }

    return (
      <div className="extend">
        <div className="ui attached top form">
          <div className="ui input seamless white">
            <i className="icon search"/>
            <input type="text" onChange={(ev) => this.onFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
          </div>
        </div>
        <h2 className="ui centered header">
          <i className={`icon ${props.icon}`}/>
          {props.title}
        </h2>

        <div className="ui padding extend">
          <div className="description">{props.description}</div>

          { tab == "filter" ? null : (
            <div className="ui pointing secondary menu">
              <a className={`item ${tab=="cloud" ? "active" : ""}`} onClick={() => this.setTab("cloud")}>Cloud</a>
              <a className={`item ${tab=="server" ? "active" : ""}`} onClick={() => this.setTab("server")}>Server</a>
              <a className={`item ${tab=="other" ? "active" : ""}`} onClick={() => this.setTab("other")}>Other</a>
            </div>
          )}

          <div className="ui with scroll and padding">
              {filtered.length==0 ? (
                <div className="ui meta">{i18n("No matches found")}</div>
              ) : filtered.map( (s) => (
                <Card key={s.id || s.type} item={s}/>
            ))}
          </div>
        </div>
      </div>
    )
  }
}

export default Selector
