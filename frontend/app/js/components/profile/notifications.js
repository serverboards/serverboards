import React from 'react'
import GenericForm from '../genericform'
import Loading from '../loading'
import { to_map } from 'app/utils'
import {MarkdownPreview} from 'react-marked-markdown';
import {i18n} from 'app/utils/i18n'


function data_from_fields(fields, data){
  data = data || {}
  let ret = {}
  for (const f of fields){
    ret[f.name] = data[f.name]
  }
  return ret
}


class Channel extends React.Component{
  componentDidMount(){
    const cb = $(this.refs.enable)
    cb.checkbox({
      onChecked: () =>{
        this.props.onUpdate({...this.props.config, is_active: true})
      },
      onUnchecked: () =>{
        this.props.onUpdate({...this.props.config, is_active: false})
      }
    })
    if (this.props.config.is_active)
      cb.checkbox("check")
    else
      cb.checkbox("uncheck")
  }
  handleUpdate(config){
    this.props.onUpdate({...config, is_active: !!this.props.config.is_active})
  }
  render(){
    const props=this.props
    return (
      <div style={{paddingTop: 15}}>
        <h3 className="ui header">{i18n(props.channel.name)}
        <div ref="enable" className="ui toggle checkbox" style={{float:"right"}}>
          <input type="checkbox" name="active"/>
          <label>{!!props.config.is_active ? i18n("Active") : i18n("Disabled")}</label>
        </div>
        </h3>
        <div className="ui meta">
          { props.channel.description ? (
            <MarkdownPreview value={i18n(props.channel.description)}/>
          ) : null }
        </div>
        <GenericForm
          fields={props.channel.extra.fields}
          data={data_from_fields(props.channel.extra.fields, props.config)}
          updateForm={(data) => this.handleUpdate(data)}
          />
      </div>
    )
  }
}

function Notifications(props){
  return (
    <div>
      <h2 className="ui header" style={{marginTop: 30}}>{i18n("Communication Channels")}</h2>
      {props.channels.map( (c) => (
        <Channel
          key={c.id} channel={c} config={props.config[c.id] || {}}
          onUpdate={(data) => props.onUpdate(c.id, data)}
          />
      ))}
    </div>
  )
}

export default Notifications
