import React from 'react'
import GenericForm from '../genericform'
import Loading from '../loading'

function Channel(props){
  return (
    <div>
      <h3 className="ui header">{props.channel.name}</h3>
      <div className="ui meta">{props.channel.description}</div>
      <GenericForm fields={props.channel.fields} updateForm={(data) => props.updateForm(props.channel.channel, data)}/>
    </div>
  )
}

function Notifications(props){
  if (!props.channels)
    return (
      <Loading>Notification channels</Loading>
    )
  return (
    <div>
      <h2 className="ui header">Communication Channels</h2>
      {props.channels.map( (c) => (
        <Channel key={c.channel} channel={c} updateForm={(channel, data) => props.updateForm(channel, data)}/>
      ))}
    </div>
  )
}

export default Notifications
