import React from 'react'
import i18n from 'app/utils/i18n'

function params_resume(params){
  let ret = []
  for(let k in params){
    ret.push(`${k}: ${params[k]}`)
  }
  return ret.join('; ')
}

function When({when, section, onChangeSection}){
  return (
    <div className="">
      <div className="legend">
        <i className="ui big icon power circle"/>
        WHEN
      </div>
      <div className="ui card">
        <div className={`${section.section=="when:service" ? "active" : ""}`}>
          <a onClick={() => onChangeSection("when:service", null, {service_id: when.params.service_id})}>
            <i className="ui cloud icon"/>
            {when.params.service_id || i18n("Select related service")}
          </a>
        </div>
        <div>
          <a onClick={() => onChangeSection("when:trigger", null, {trigger: when.trigger})}>
            <i className="ui toggle on icon"/> {when.trigger || i18n("Select a trigger")}
          </a>
        </div>
        <div>
          <a onClick={() => onChangeSection("when:params", null, {params: when.params})}>
            <i className="ui wrench icon"/> {params_resume(when.params) || i18n("Setup trigger")}
          </a>
        </div>
      </div>
    </div>
  )
}

export default When
