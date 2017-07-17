import React from 'react'
import PropTypes from 'prop-types'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Icon from '../../iconicon'
import {MarkdownPreview} from 'react-marked-markdown'

const DEFAULT_ICON={
  cloud: "cloud",
  server: "server",
  other: "hourglass full",
  filter: "lab"
}

function default_icon_for(item, section){
  if (item.traits.indexOf("cloud")!=-1)
    return "cloud"
  if (item.traits.indexOf("server")!=-1)
    return "server"
  return DEFAULT_ICON[section]
}

function Card({item, default_icon, onClick, className}){
  const plugin = item.plugin_id || (item.type && item.type.split('/')[0])
  const icon = item.icon || default_icon
  return (
    <a className={`ui wide card ${className || ""}`} style={{padding: 5}} onClick={onClick}>
      <h3 className="ui header">
        <Icon className="mini" icon={icon} plugin={plugin}/>
        {item.name}
      </h3>
      <div className="description">
        <MarkdownPreview value={item.description || ""}/>
      </div>
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
    let filtered = this.state.items.filter( s => s.traits.indexOf("hidden")==-1 )

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
                <Card
                  className={props.current==(s.id || s.type) ? "active" : null}
                  key={s.id || s.type}
                  item={s}
                  default_icon={default_icon_for(s, tab)}
                  onClick={() => props.onSelect(s)}
                  />
            ))}
          </div>
          {this.props.prevStep||this.props.nextStep ? (
            <div className="right aligned">
            <span className="ui buttons">
            {this.props.prevStep ? (
              <button className="ui button basic" onClick={this.props.prevStep}>{i18n("Previous step")}</button>
            ) : null}
            {this.props.nextStep ? (
              <button className="ui button basic" onClick={this.props.nextStep}>{i18n("Next step")}</button>
            ) : null}
            </span>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}

Selector.propTypes={
  onSelect: PropTypes.func.isRequired,
  get_items: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  current: PropTypes.string
}

export default Selector
