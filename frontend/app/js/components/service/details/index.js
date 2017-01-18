import React from 'react'
import Modal from '../../modal'
import Loading from '../../loading'
import ImageIcon from '../../imageicon'
import IconIcon from '../../iconicon'
import {goto} from 'app/utils/store'
import store from 'app/utils/store'
const icon = require("../../../../imgs/services.svg")
import {match_traits, get_service_data} from '../utils'
import PluginScreen from 'app/components/plugin/screen'

import Empty from 'app/components/empty'
import Settings from 'app/containers/service/settings'
import DetailsTab from './detailstab'
import ExternalUrl from './externalurl'

const tab_options={
  details: DetailsTab,
  settings: Settings
}
function get_plugin_component(props){
  const {tab, type} = props
  if (type!="screen")
    return null
  let sp=tab.split('/')
  return (props) => (
    <PluginScreen data={{service: props.service, serverboard: props.serverboard}} plugin={sp[0]} component={sp[1]}/>
  )
}
function get_external_url_component(props){
  const {tab, type} = props
  if (type!="external url")
    return null
  const url = get_external_url(tab, props)
  return (props) => (
    <ExternalUrl url={url}/>
  )
}

function get_external_url_template(id, props){
  for(let eu of (props.external_urls || [])){
    if (eu.id==id){
      return eu
    }
  }
  return null
}
function get_external_url(id, props){
  const eu=get_external_url_template(id, props)
  if (!eu)
    return null

  let url = eu.extra.url
  const config = props.service.config
  Object.keys(config).map((k) => {
    url = url.replace(`{config.${k}}`, config[k])
  })
  return url
}

const Details = React.createClass({
  propTypes:{
    screens: React.PropTypes.arrayOf(React.PropTypes.object),
    service: React.PropTypes.shape({
      uuid: React.PropTypes.string.isRequired,
      name: React.PropTypes.string.isRequired,
      description: React.PropTypes.string,
      config: React.PropTypes.object.isRequired,
    }).isRequired,
    service_template: React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      description: React.PropTypes.string,
      params: React.PropTypes.string,
    }).isRequired
  },
  handleTabChange(id, type){
    if (type=="screen"){
      goto(null, {tab: id, type: "screen"})
    }
    else if (type=="external url"){
      const euc = get_external_url_template(id, this.props)
      if (!euc.extra.iframe){
        const url = get_external_url(id, this.props)
        if (!url)
          console.warn("Invalid URL from %o", id)
        else
          window.open(url)
      }
      else{
        goto(null, {tab: id, type: "external url"})
      }
    }
    else{
      goto(null, {tab: id})
    }
  },
  componentDidMount(){
    goto(null, {tab: "details"})
  },
  render(){
    const props = this.props
    if (props.loading){
      return (
        <Loading>Service details</Loading>
      )
    }
    let current_tab = props.tab

    let sections=[
      { name: "Details", id: "details" },
      { name: "Settings", id: "settings" },
    ];

    props.screens.map( (s) => {
      if (match_traits(s.traits, props.service.traits)){
        sections.push({
          name: s.name,
          id: s.id,
          description: s.description,
          type: "screen"
        })
      }
    });

    (props.external_urls || []).map( (u) => {
      sections.push({
        name: u.name,
        id: u.id,
        description: u.description,
        type: "external url",
        icon: !u.extra.iframe ? "external" : null
      })
    })
    let CurrentTab = (
      tab_options[current_tab] ||
      get_plugin_component(props) ||
      get_external_url_component(props) ||
      Empty
    )

    let handleClose = undefined
    if (props.serverboard)
      handleClose = () => goto(`/serverboard/${props.serverboard.shortname}/services`)

    return (
      <Modal className="wide" onClose={handleClose}>
        <div className="ui top secondary pointing menu" style={{paddingBottom: 0}}>
          {props.service.icon ? (
            <IconIcon src={icon} icon={props.service.icon} plugin={props.service.type.split('/',1)[0]}/>
          ) : (
            <ImageIcon src={icon}  name={props.service.name}/>
          )}

          <div style={{display: "inline-block"}}>
            <h3 className="ui header" style={{paddingRight: 50, marginBottom: 0}}>{props.service.name}</h3>
            <span className="ui meta">{props.service_template.name}</span>
          </div>
          {sections.map( (s) => (
            <a
              key={s.id}
              className={`item ${(s.id == current_tab) ? "active" : ""}`}
              onClick={() => this.handleTabChange(s.id, s.type)}
              title={s.description}
              >
                {s.name}
                {s.icon ? (
                  <i className={`ui icon ${s.icon}`}/>
                ) : null}
            </a>
          ))}
        </div>
        <div className="ui full height">
          <CurrentTab {...props} service={props.service} onClose={handleClose} />
        </div>
      </Modal>
    )
  }
})

export default Details
