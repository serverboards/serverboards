import React from 'react'
import PropTypes from 'prop-types'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import Icon from './iconicon'
import Loading from './loading'
import Error from './error'
import {MarkdownPreview} from 'react-marked-markdown'
import {match_traits} from 'app/utils'

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
  console.log("Filter for %o is %o (%d)", filter, filtered, filtered.length)
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
      filter: "", // A filter to show
      all_items: undefined, // Dict with category name and items in that category
      show_items: undefined,
    }
    this.onFilter = (filter) => {
      let show_items
      if (filter=="")
        show_items = this.categorize(this.state.all_items)
      else
        show_items = this.categorize(filter_items( this.state.all_items, filter ))
      this.setState({show_items})
    }
  }
  categorize(items){
    let cloud=[]
    let server=[]
    let other=[]
    for (const i of items){
      if (match_traits({has: i.traits, all: ["cloud"]}))
        cloud.push(i)
      else if (match_traits({has: i.traits, all: ["server"]}))
        server.push(i)
      else
        other.push(i)
    }

    let by_category = {}
    if (cloud.length>0)
      by_category[i18n("Cloud")] = cloud
    if (server.length>0)
      by_category[i18n("Server")] = server
    if (other.length>0)
      by_category[i18n("Other")] = other

    return by_category
  }
  componentDidMount(){
    this.props.get_items().then( items => {
      const all_items=items
        .filter( s => s.traits.indexOf("hidden")==-1 )
        .sort( (a,b) => a.name.localeCompare(b.name) )

        const show_items=this.categorize(all_items)

      this.setState({all_items, show_items})
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

    if (!this.state.show_items){
      return (
        <Loading>{this.props.title}</Loading>
      )
    }
    const props = this.props
    const show_items = this.state.show_items
    const sections = Object.keys(show_items)

    return (
      <div className="extend">
        <div className="ui attached top form">
          <div className="ui input seamless white">
            <i className="icon search"/>
            <input type="text" onChange={(ev) => this.onFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
          </div>
        </div>
        {props.title ? (
          <h2 className="ui centered header">
            <i className={`icon ${props.icon}`}/>
            {props.title}
          </h2>
        ) : null}

        <div className="ui extend">
          {props.description ? (
            <div className="ui description with padding">{props.description}</div>
          ) : null }

          <div className="ui with scroll and padding">
              {sections.length==0 ? (
                <div className="ui meta">{i18n("No matches found")}</div>
              ) : sections.map( (s) => (
                <div key={s}>
                  <h3 className="ui teal header">{s}</h3>
                  { show_items[s].map( i => (
                    <Card
                      className={props.current==(i.id || i.type) ? "active" : null}
                      key={i.id || i.type}
                      item={i}
                      default_icon={default_icon_for(i, "cloud")}
                      onClick={() => props.onSelect(i)}
                      />
                  ))}
                  <div className="ui separator" style={{height: 10}}/>
                </div>
              ) ) }
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
