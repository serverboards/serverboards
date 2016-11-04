import React from 'react'
import store from 'app/utils/store'
import {goto} from 'app/utils/store'
import {MarkdownPreview} from 'react-marked-markdown';

function serverboard_name(shortname){
  return (store.getState().serverboard.serverboards.find( (s) => s.shortname == shortname) || {}).name
}

function is_current_serverboard(shortname){
  return (store.getState().serverboard.current ==  shortname)
}

function DetailsTab(props){
  return (
    <div className="ui grid" style={{flexGrow:1, margin: 0}}>
      <div className="six wide column" style={{borderRight:"1px solid #ddd", paddingLeft: 20}}>
        <h3 className="ui header">Service Type</h3>
        {props.service_template.name}
        <h3 className="ui header">Description</h3>
        {props.service_template.description ? (
          <MarkdownPreview className="ui meta" value={props.service_template.description}/>
        ) : null}
        <h3 className="ui header">Used on Serverboards</h3>
        <div className="ui vertical secondary menu">
          {props.service.serverboards.map( (s) => (
            <div key={s} className={`item ${is_current_serverboard(s) ? "active" : ""}`} onClick={() => goto(`/serverboard/${s}/`)} style={{cursor: "pointer"}}>
              {s} - {serverboard_name(s)}
              <i className="ui chevron right icon"/>
            </div>
          ))}
        </div>
      </div>
      <div className="ten wide column">
        <h3 className="ui header">Description</h3>
        <MarkdownPreview className="ui meta" value={props.service.description || "No description set"}/>
        <h3 className="ui header">Config Details</h3>
        <div className="ui grid">
          {((props.service_template || {}).fields || []).map( (f) => (
            <div key={f.name} className="row">
              <label className="four wide column" style={{fontWeight:"bold"}}>{f.label || f.name}</label>
              <div className="twelve wide column">
                {props.service.config[f.name] ? (props.service.config[f.name].name || props.service.config[f.name]) : (
                  <div className="ui meta">{f.value || f.placeholder}</div>
                )}
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


export default DetailsTab
