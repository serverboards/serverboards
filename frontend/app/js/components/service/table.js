import React from 'react'
import {colorize} from 'app/utils'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import ActionMenu from 'app/containers/service/actionmenu'
import Loading from '../loading'
import {goto} from 'app/utils/store'
import {i18n} from 'app/utils/i18n'

const icon = require("../../../imgs/services.svg")

require("sass/service/table.sass")

export function service_definition(service_type, service_catalog){
  return service_catalog.find( (c) => c.type == service_type )
}



const ServiceTableLine = React.createClass({
  handleOpenDetails(){
    goto(`/project/${this.props.project.shortname}/services/${this.props.service.uuid}`)
  },
  render(){
    const props=this.props
    const s=props.service
    const d=props.definition || {}
    let tags = s.tags || []
    if (!s.config || $.isEmptyObject(s.config))
      tags = tags.concat("NOT-CONFIGURED")

    return (
      <tr ref="el" onClick={this.handleOpenDetails} style={{cursor: "pointer"}}>
        <td>
          {d.icon ? (
            <IconIcon src={icon} icon={d.icon} plugin={d.type.split('/',1)[0]}/>
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
          <ActionMenu service={props.service} actions={props.actions}>
            {i18n("Options")}
          </ActionMenu>
        </td>
      </tr>
    )
  }
})

function Table(props){
  if (!props.catalog)
    return (
       <Loading>Service catalog</Loading>
    )
  return (
    <table className="ui service selectable table">
      <thead><tr>
        <th/><th>{i18n("Name")}</th><th>{i18n("Type")}</th><th>{i18n("Description")}</th><th>{i18n("Status")}</th><th>{i18n("Actions")}</th>
      </tr></thead>
      <tbody>
      {props.services.map((p) => (
        <ServiceTableLine key={p.uuid} service={p} project={props.project} definition={service_definition(p.type, props.catalog)}/>
      ))}
      </tbody>
    </table>
  )
}

export default Table
