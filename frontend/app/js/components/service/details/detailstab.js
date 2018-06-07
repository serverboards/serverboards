import React from 'react'
import store from 'app/utils/store'
import {goto} from 'app/utils/store'
import {MarkdownPreview} from 'react-marked-markdown';
import {i18n} from 'app/utils/i18n'
import cache from 'app/utils/cache'
import ServiceLink from 'app/components/servicelink'
import {FutureLabel} from 'app/components'

function is_current_project(shortname){
  return (store.getState().project.current ==  shortname)
}

function DataField({field, value}){
  let inner = null

  switch(field.type){
    case "description":
    case "hidden":
      return null
    case "button":
      return null
    case "password":
      inner = "********"
      break;
    case "service":
      inner = (
        <ServiceLink service={value}/>
      )
      break;
    default:
      if (value)
        inner = (
          <span className="ui oneline" style={{maxWidth: "30vw", display: "block"}}>{value}</span>
        )
      else
        inner = (
          <div className="ui meta">
            {field.value || i18n(field.placeholder)}
          </div>
        )
      break;
  }


  return (
    <div className="row">
      <label className="four wide column" style={{fontWeight:"bold"}}>{i18n(field.label || field.name)}</label>
      <div className="ui twelve wide column with oneline">
        {inner}
      </div>
    </div>
  )
}

function DetailsTab(props){
  return (
    <div className="ui grid" style={{flexGrow:1, margin: 0}}>
      <div className="six wide column" style={{borderRight:"1px solid #ddd", paddingLeft: 20}}>
        <h3 className="ui header">{i18n("Service Type")}</h3>
        {props.service_template.name}
        <h3 className="ui header">{i18n("Description")}</h3>
        {props.service_template.description ? (
          <MarkdownPreview className="ui grey text" value={i18n(props.service_template.description)}/>
        ) : null}
        <h3 className="ui header">{i18n("Related projects")}</h3>
        <div className="ui vertical secondary menu" style={{width:"100%"}}>
          {props.service.projects.map( (s) => (
            <div key={s} className={`item ${is_current_project(s) ? "active" : ""}`} onClick={() => goto(`/project/${s}/`)} style={{cursor: "pointer"}}>
              {s} - <FutureLabel promise={() => cache.project(s).then(s => s.name)}/>
              <i className="ui chevron right icon"/>
            </div>
          ))}
        </div>
      </div>
      <div className="ten wide column" style={{overflow: "hidden"}}>
        <h3 className="ui header">{i18n("Description")}</h3>
        <MarkdownPreview className="ui grey text" value={props.service.description || i18n("Not provided")}/>
        <h3 className="ui header">{i18n("Config Details")}</h3>
        <div className="ui grid">
          {((props.service_template || {}).fields || []).map( (f, i) => (
            <DataField key={f.name || i} field={f} value={props.service.config[f.name]}/>
          ))}
        </div>
      </div>
    </div>
  )
}


export default DetailsTab
