import React from 'react'
import {colorize} from 'app/utils'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import ActionMenu from 'app/containers/service/actionmenu'

const icon = require("../../../imgs/services.svg")

export function service_definition(service_type, service_catalog){
  return service_catalog.find( (c) => c.type == service_type )
}

const ServiceTableLine = React.createClass({
  componentDidMount(){
    $(this.refs.dropdown).dropdown()
  },
  render(){
    const props=this.props
    const s=props.service
    const d=props.definition || {}
    return (
      <tr>
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
          {(s.tags || []).map( (l) => (
            <span style={{color:"#ccc", display:"block", whiteSpace:"nowrap"}}>
              <span className={`ui circular empty ${colorize(l)} label`}/> {l}
            </span>
          ))}
        </td>
        <td>
        <a className="ui item dropdown" ref="dropdown">
          More
          <i className="ui ellipsis vertical icon"/>
          <ActionMenu service={props.service} actions={props.actions}/>
        </a>

        </td>
      </tr>
    )
  }
})

function Table(props){
  return (
    <table className="ui selectable table">
      <thead><tr>
        <th/><th>Name</th><th>Type</th><th>Description</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
      {props.services.map((p) => (
        <ServiceTableLine service={p} serverboard={props.serverboard} definition={service_definition(p.type, props.catalog)}/>
      ))}
      </tbody>
    </table>
  )
}

export default Table
