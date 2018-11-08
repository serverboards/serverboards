import React from 'react'
import { colorize } from 'app/utils'
import Icon from '../iconicon'
import cache from 'app/utils/cache'
import {MarkdownPreview} from 'react-marked-markdown'
import i18n from 'app/utils/i18n'
import {simple_tag, get_template} from './utils'

function first_paragraph(str){
  return (str || "").split('\n\n')[0]
}

function Card(props){
  const {service, className, template} = props
  const description = service.description || template.description
  return (
    <div key={service.uuid} className={`ui narrow card ${className || ""}`} onClick={props.onClick}
         style={{cursor: props.onClick ? "pointer" : "cursor"}}>
      <div className="header">
        <div style={{margin: "7px 0 0 7px"}}>
          {template == "error" ? (
            <Icon icon="red ban" className="ui mini"/>
          ) : (
              <Icon icon={template.icon} plugin={template.plugin} className="ui mini grey"/>
          )}
        </div>
        <div className="right">
          {(service.tags || []).map(s => simple_tag(s)).map( s => (
            <span key={s} className="ui text label">
              {s}&nbsp;
              <i className={`ui rectangular label ${ colorize( s ) }`}/>
            </span>
          ))}
        </div>
      </div>
      <div className="content">
        <h3 className="ui header">{service.name}</h3>
        {template == "error" ? (
          <div className="ui red text">{i18n("This service type is not properly installed. Please install the appropiate plugin at Settings")}</div>
        ) : (
          <MarkdownPreview value={first_paragraph(description)}/>
        )}
      </div>
      <div className="extra content">
        {props.bottomElement && (
          <props.bottomElement {...props}/>
        )}
      </div>
    </div>
  )
}

export default Card
