import React from 'react'
import PropTypes from 'prop-types'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import utils from 'app/utils'
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

// Tags 1 or 2
const TAGS_TYPE=2

function default_icon_for(item, section){
  const traits = item.traits || []
  if (traits.indexOf("cloud")!=-1)
    return "cloud"
  if (traits.indexOf("server")!=-1)
    return "server"
  return DEFAULT_ICON[section]
}

function filter_items(items, filter){
  if (filter.call){ // is function
    return items.filter( s => filter(s) )
  }
  if (!Array.isArray(filter))
    filter = filter.toLocaleLowerCase().split(' ')
  console.log(items, filter)
  let ret = utils.filter_items_str( items, filter, (s) => `${s.name || ""} ${s.description}` )
  console.log(ret)
  return ret
}

function Card({item, default_icon, onClick, className}){
  const plugin = item.plugin_id || item.plugin || (item.type && item.type.split('/')[0])
  const icon = item.icon64 || item.icon || (item.extra || {}).icon || default_icon
  return (
    <a className={`ui wide card ${className || ""}`} style={{padding: 5}} onClick={onClick}>
      <div className="ui split area horizontal" style={{alignItems: "center", marginBottom: 5}}>
        <Icon className="mini" icon={icon} plugin={plugin}/>
        <h3 className="ui header" style={{margin: "5px 5px 5px 15px", height: "auto", width: "auto"}}>{i18n(item.name)}</h3>
        {item.tag ? (TAGS_TYPE == 1) ? (
          <span className={`ui top right attached label ${item.tag.color}`} style={{marginLeft: "-0.5rem"}}>{item.tag.label}</span>
        ) : (
          <React.Fragment>
            <span className="ui grey text"> | </span>
            <span className={`ui text ${item.tag.color}`}>&nbsp;{item.tag.label}</span>
          </React.Fragment>
        ) : null}
      </div>
      <div className="description">
        <MarkdownPreview value={i18n(item.description) || ""}/>
      </div>
    </a>
  )
}

class Selector extends React.Component{
  constructor(props){
    super(props)
    this.state={
      all_items: undefined, // Dict with category name and items in that category
      show_items: undefined,
      delayed_filter: undefined // Delays search filters a bit to coalesce multiple keystrokes
    }
    this.onFilter = (filter) => {
      if (this.state.delayed_filter){
        clearTimeout(this.state.delayed_filter)
      }
      const delayed_filter = setTimeout( () => {
        let show_items
        if (filter=="")
          show_items = this.categorize(this.state.all_items)
        else
          show_items = this.categorize(filter_items( this.state.all_items, filter ))
        this.setState({show_items, delayed_filter: undefined})
      }, 200)
      this.setState({delayed_filter})
    }
  }
  categorize(items){
    let cloud=[]
    let server=[]
    let other=[]
    for (const i of items){
      if (utils.match_traits({has: i.traits, all: ["cloud"]}))
        cloud.push(i)
      else if (utils.match_traits({has: i.traits, all: ["server"]}))
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
        .filter( s => (s.traits || []).indexOf("hidden")==-1 )
        .sort( (a,b) => a.name.localeCompare(b.name) )

      const filter = this.props.filter
      let show_items
      if (!filter || filter=="")
        show_items = this.categorize(all_items)
      else
        show_items = this.categorize(filter_items( all_items, filter ))

      this.setState({all_items, show_items})
    } ).catch( e => {
      console.error(e)
      this.setState({error: i18n("Error loading items. Maybe connectivity problems? {error_msg}.",{error_msg: e})})
    })
  }
  componentWillReceiveProps(newprops){
    if (newprops.filter != this.props.filter){
      this.onFilter(newprops.filter)
    }
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
    const state = this.state
    const show_items = this.state.show_items
    const sections = Object.keys(show_items)

    return (
      <div className="extend">
        {props.show_filter && (
          <div className="ui attached top form">
            <div className="ui input seamless white">
              <i className="icon search"/>
              <input type="text" onChange={(ev) => this.onFilter(ev.target.value)} placeholder={i18n("Filter...")} defaultValue={props.filter}/>
            </div>
          </div>
        )}
        {props.title ? (
          <h2 className="ui centered header" style={{marginTop:25}}>
            <i className={`icon ${props.icon}`}/>
            {props.title}
          </h2>
        ) : null}

        <div className="ui extend">
          {props.description ? (
            <div className="ui description with padding">{props.description}</div>
          ) : null }

          <div className="ui with scroll and padding">
            {(!state.all_items || state.all_items.length==0) ? (
              <div>
                <img className="ui centered big image" src={require("imgs/026-illustration-nocontent.svg")}/>
                <div className="ui padding">
                  <MarkdownPreview value={props.no_items_label || i18n("There are no items for selection.")}/>
                </div>
              </div>
            ) : (sections.length==0) ? (
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
          {props.prevStep||props.nextStep||props.onSkip ? (
            <div className="right aligned">
            <span className="ui buttons">
            {props.prevStep ? (
              <button className="ui button basic" onClick={props.prevStep}>{props.prev_label || i18n("Back")}</button>
            ) : null}
            {props.nextStep ? (
              <button className="ui button basic" onClick={props.nextStep}>{props.next_label || i18n("Continue")}</button>
            ) : null}
            {props.onSkip ? (
              <button className="ui button basic" onClick={props.onSkip}>{props.skip_label || i18n("Skip")}</button>
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
  icon: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  current: PropTypes.string,
  onSkip: PropTypes.func,
  skip_label: PropTypes.string,
  prevStep: PropTypes.func,
  prev_label: PropTypes.func,
  nextStep: PropTypes.func,
  next_label: PropTypes.func,

  show_filter: PropTypes.bool, // Whether to show the filter line
  filter: PropTypes.oneOfType([
    PropTypes.string, // Current filter, may be out of the view itself
    PropTypes.func, // Current filter, may be out of the view itself
  ])
}

Selector.defaultProps={
  show_filter: true
}

export default Selector
