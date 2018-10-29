import React from 'react'
import {colorize} from 'app/utils'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import {CardBottom} from 'app/components/service/cards'
import Loading from '../loading'
import {goto} from 'app/utils/store'
import {i18n} from 'app/utils/i18n'
import {get_template} from './utils'

const icon = require("../../../imgs/services.svg")

require("sass/service/table.sass")

function ServiceTableLine(props){
  const service = props.service
  let tags = service.tags || []
  if (!service.config || $.isEmptyObject(service.config))
    tags = tags.concat("NOT-CONFIGURED")
  tags = tags.map( t => {
    if (t.startsWith("status:"))
      return t.slice(7)
    return t
  })
  const template = props.template || {}

  return (
    <tr ref="el" onClick={() => props.onSelectService(service)} style={{cursor: "pointer"}} className={props.className}>
      <td>
        {template.icon ? (
          <IconIcon icon={template.icon} plugin={template.plugin}/>
        ) : (
          <ImageIcon src={template.icon} name={service.name}/>
        )}
      </td>
      <td><b>{service.name}</b></td>
      <td>{template.name}</td>
      <td className="ui meta">{service.description}</td>
      <td>
        {(tags || []).map( (l) => (
          <span key={l} style={{color:"#ccc", display:"block", whiteSpace:"nowrap"}}>
            <span className={`ui circular empty ${colorize(l)} label`}/> {l}
          </span>
        ))}
      </td>
      <td>
        <CardBottom
          service={props.service}
          project={props.project}
          >
          {i18n("Options")} <i className="ui dropdown icon"/>
        </CardBottom>
      </td>
    </tr>
  )
}

function Table(props){
  if (!props.catalog)
    return (
       <Loading>Service catalog</Loading>
    )
  return (
    <div className="ui scroll with padding">
    <table className="ui service selectable table">
      <thead><tr>
        <th/><th>{i18n("Name")}</th><th>{i18n("Type")}</th><th>{i18n("Description")}</th><th>{i18n("Status")}</th><th>{i18n("Actions")}</th>
      </tr></thead>
      <tbody>
      {props.services.map((p) => (
        <ServiceTableLine
          key={p.uuid}
          service={p}
          project={props.project}
          template={props.catalog[p.type] || "error"}
          onSelectService={props.onSelectService}
          className={props.selected_uuid == p.uuid && "selected" || undefined}
          />
      ))}
      </tbody>
    </table>
    </div>
  )
}

export default Table
