import React from 'react'
import GenericForm from '../genericform'
import Loading from '../loading'

let Channel=React.createClass({
  getInitialState(){
    console.log(this.props)
    this.props.onEnableChange(this.props.channel.is_active)
    return {
      active: this.props.channel.is_active
    }
  },
  componentDidMount(){
    $(this.refs.enable).checkbox({
      onChecked: () =>{
        this.setState({ active: true })
        this.props.onEnableChange(true)
      },
      onUnchecked: () =>{
        this.setState({ active: false })
        this.props.onEnableChange(false)
      },
      onChange(){ console.log(3) },
    })
  },
  render(){
    const props=this.props
    console.log(this.props)
    console.log(this.state)
    return (
      <div>
        <h3 className="ui header">{props.channel.name}
        <div ref="enable" className="ui toggle checkbox" style={{float:"right"}}>
          <input type="checkbox" name="active" defaultChecked={this.state.active}/>
          <label>{this.state.active ? "Active" : "Disabled"}</label>
        </div>
        </h3>
        <div className="ui meta">{props.channel.description}</div>
        <GenericForm
          fields={props.channel.fields}
          updateForm={(data) => props.updateForm(data)}
          />
      </div>
    )
  }
})

function Notifications(props){
  if (!props.channels)
    return (
      <Loading>Notification channels</Loading>
    )
  console.log(props.channels)
  return (
    <div>
      <h2 className="ui header">Communication Channels</h2>
      {props.channels.map( (c) => (
        <Channel
          key={c.channel} channel={c}
          updateForm={(data) => props.updateForm(c.channel, data)}
          onEnableChange={(state) => props.updateForm(c.channel+"/active", {is_active: state})}
          />
      ))}
    </div>
  )
}

export default Notifications
