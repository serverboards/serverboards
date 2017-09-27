import React from 'react'
import Modal from '../../modal'
import Loading from '../../loading'
import ImageIcon from '../../imageicon'
import IconIcon from '../../iconicon'
import {goto} from 'app/utils/store'
import store from 'app/utils/store'
const icon = require("../../../../imgs/services.svg")
import {get_service_data} from '../utils'
import PluginScreen from 'app/components/plugin/screen'

import Empty from 'app/components/empty'
import Settings from 'app/containers/service/settings'
import Logs from 'app/containers/service/logs'
import DetailsTab from './detailstab'
import Rules from './rules'
import ExternalUrl from './externalurl'
import {i18n} from 'app/utils/i18n'
import TabBar from 'app/components/tabbar'
import {match_traits} from 'app/utils'

const tab_options={
  details: DetailsTab,
  settings: Settings,
  rules: Rules,
  logs: Logs
}

function get_plugin_component({tab, type}, props){
  if (type!="screen")
    return null
  let sp=tab.split('/')
  return (props) => (
    <PluginScreen data={{service: props.service, project: props.project}} plugin={sp[0]} component={sp[1]}/>
  )
}
function get_external_url_component({tab, type}, props){
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
  getInitialState(){
    return {tab: "details", type: "internal"}
  },
  setTab({tab, type}){
    this.setState({tab, type})
  },
  handleTabChange(id, type){
    if (type=="screen"){
      this.setTab({tab: id, type: "screen"})
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
        this.setTab({tab: id, type: "external url"})
      }
    }
    else{
      this.setTab({tab: id})
    }
  },
  componentDidMount(){
    this.setTab({tab: "details"})
  },
  render(){
    const props = this.props
    const state = this.state
    if (props.loading){
      return (
        <Loading>{i18n("Service details")}</Loading>
      )
    }
    let current_tab = state.tab

    let sections=[
      { name: i18n("Details"), id: "details" },
      { name: i18n("Settings"), id: "settings" },
      { name: i18n("Rules"), id: "rules" },
      { name: i18n("Logs"), id: "logs" },
    ];

    props.screens.map( (s) => {
      if (match_traits({has: s.traits, any: props.service.traits})){
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
      get_plugin_component(state, props) ||
      get_external_url_component(state, props) ||
      Empty
    )

    let handleClose = undefined
    if (props.project)
      handleClose = () => goto(`/project/${props.project.shortname}/services`)

    return (
      <div className="extend">
        <div className="ui top secondary pointing menu" style={{paddingBottom: 0}}>
          {props.service.icon ? (
            <IconIcon src={icon} icon={props.service.icon} plugin={props.service.type.split('/',1)[0]}/>
          ) : (
            <ImageIcon src={icon} name={props.service.name}/>
          )}

          <div style={{display: "inline-block"}}>
            <h3 className="ui header" style={{paddingRight: 50, marginBottom: 0}}>{i18n(props.service.name)}</h3>
            <span className="ui meta">{i18n(props.service_template.name)}</span>
          </div>
          <TabBar tabs={sections.map( s => ({
            key: s.id,
            label: s.name,
            icon: s.icon,
            onClick: () => this.handleTabChange(s.id, s.type),
            active: (s.id == current_tab),
            description: s.title
          }) ) } />
        </div>
        <div className="ui full height">
          <CurrentTab {...props} service={props.service} onClose={handleClose} />
        </div>
      </div>
    )
  }
})

export default Details
