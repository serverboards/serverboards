import React from 'react'
import PropTypes from 'prop-types'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Icon from './iconicon'
import Loading from './loading'
import Error from './error'
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

function filter_items(items, filter){
  let filtered = items
  for(let filter of filter.split(' ')){
    filtered = filtered.filter( s => (
      (s.name || "").toLocaleLowerCase().includes(filter.toLocaleLowerCase()) ||
      (s.description || "").toLocaleLowerCase().includes(filter.toLocaleLowerCase())
    ) )
  }
  return filtered
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
      tab: undefined,
      items: undefined,
      filter: "",
      tabs: {
        cloud: [],
        server: [],
        other: [],
      }
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
      // console.log(catalog)

      // get current selected item tab
      let tab = "cloud"
      let current = catalog.find( c => (c.id || c.type) == this.props.current )
      if (current){
        if (current.traits.indexOf("cloud")!=-1)
          tab="cloud"
        else if (current.traits.indexOf("server")!=-1)
          tab="server"
        else
          tab="other"
      }

      // sort items by tab
      let server = [], cloud = [], other = []
      for (let s of catalog){
        const traits = s.traits || []
        if (traits.indexOf("server")!=-1)
          server.push(s)
        else if (traits.indexOf("cloud")!=-1)
          cloud.push(s)
        else
          other.push(s)
      }
      const tabs = {server, cloud, other}

      this.setState({items: catalog, tab, tabs})
    } ).catch( e => {
      console.error(e)
      this.setState({error: i18n("Error loading items. Maybe connectivity problems? {error_msg}.",{error_msg: e})})
    })
  }
  render(){
    if (this.state.error){
      return (
        <Error>{this.state.error}</Error>
      )
    }

    if (!this.state.items){
      return (
        <Loading>{this.props.title}</Loading>
      )
    }
    const props = this.props
    const tab = this.state.tab
    let filtered = this.state.items.filter( s => s.traits.indexOf("hidden")==-1 )
    const {server, cloud, other} = this.state.tabs
    const has_server = server.length>0
    const has_cloud = cloud.length>0
    const has_other = other.length>0

    if (tab == "filter"){
      filtered = filter_items( filtered, this.state.filter )
    }
    else{
      switch(tab){
        case "server":
          filtered=server
          break;
        case "cloud":
          filtered=cloud
          break;
        case "other":
          filtered=other
          break;
        default:
          filtered=[]
      }
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
              <a
                className={`item ${tab=="cloud" ? "active" : ""} ${has_cloud ? "" : "disabled"}`}
                onClick={() => has_cloud && this.setTab("cloud")}
                >Cloud</a>
              <a
                className={`item ${tab=="server" ? "active" : ""} ${has_server ? "" : "disabled"}`}
                onClick={() => has_server && this.setTab("server")}
                >Server</a>
              <a
                className={`item ${tab=="other" ? "active" : ""} ${has_other ? "" : "disabled"}`}
                onClick={() => has_other && this.setTab("other")}
                >Other</a>
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
            {this.props.onSkip ? (
              <button className="ui button basic" onClick={this.props.onSkip}>{this.props.skip_label}</button>
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
  current: PropTypes.string,
  onSkip: PropTypes.func,
  skip_label: PropTypes.string,
}

export default Selector
