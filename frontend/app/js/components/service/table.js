import React from 'react'
import {colorize} from 'app/utils'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import {CardBottom} from 'app/components/service/cards'
import Loading from '../loading'
import {goto} from 'app/utils/store'
import {i18n} from 'app/utils/i18n'

const icon = require("../../../imgs/services.svg")

require("sass/service/table.sass")

export function service_definition(service_type, service_catalog){
  return service_catalog.find( (c) => c.type == service_type )
}



function ServiceTableLine(props){
  const s=props.service
  const d=props.definition || {}
  let tags = s.tags || []
  if (!s.config || $.isEmptyObject(s.config))
    tags = tags.concat("NOT-CONFIGURED")
  tags = tags.map( t => {
    if (t.startsWith("status:"))
      return t.slice(7)
    return t
  })

  return (
    <tr ref="el" onClick={() => props.onSelectService(s)} style={{cursor: "pointer"}} className={props.className}>
      <td>
        {d.icon ? (
          <IconIcon icon={d.icon} plugin={d.type.split('/',1)[0]}/>
        ) : (
          <ImageIcon src={icon} name={s.name}/>
        )}
      </td>
      <td><b>{s.name}</b></td>
      <td>{d.name}</td>
      <td className="ui meta">{s.description}</td>
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
          definition={service_definition(p.type, props.catalog)}
          onSelectService={props.onSelectService}
          className={props.selected_uuid == p.uuid && "selected"}
          />
      ))}
      </tbody>
    </table>
    </div>
  )
}

export default Table
