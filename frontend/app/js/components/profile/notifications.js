import React from 'react'
import GenericForm from '../genericform'
import Loading from '../loading'

let Channel=React.createClass({
  getInitialState(){
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
      }
    })
    this.props.onEnableChange(this.props.channel.is_active)
  },
  render(){
    const props=this.props
    return (
      <div style={{paddingTop: 15}}>
        <h3 className="ui header">{props.channel.name}
        <div ref="enable" className="ui toggle checkbox" style={{float:"right"}}>
          <input type="checkbox" name="active" defaultChecked={this.state.active}/>
          <label>{this.state.active ? "Active" : "Disabled"}</label>
        </div>
        </h3>
        <div className="ui meta">{props.channel.description}</div>
        <GenericForm
          fields={props.channel.fields}
          updateForm={(data) => props.onUpdate(data)}
          />
      </div>
    )
  }
})

function to_map(l){
  let ret={}
  for (let kv of l){
    ret[kv[0]]=kv[1]
  }
  return ret
}

const Notifications=React.createClass({
  getInitialState(){
    return this.getStatus(this.props)
  },
  componentWillReceiveProps(props){
    this.setState( this.getStatus(props) )
  },
  getStatus(props){
    let ret={}
    for (let k in props.channels){
      let c=props.channels[k]
      ret[c.channel]={
        is_active: c.is_active,
        config: to_map( c.fields.map((f) => [f.name, f.value]) )
      }
    }
    return ret
  },
  handleConfigUpdate(chan, data){
    this.setState( { [chan]: { config: data, is_active: this.state[chan].is_active } } )
    this.props.onUpdate(this.state)
  },
  handleEnableUpdate(chan, state){
    this.setState( { [chan]: { config: this.state[chan].config, is_active:state } } )
    this.props.onUpdate(this.state)
  },
  render(){
    let props=this.props
    if (!props.channels)
      return (
        <Loading>Notification channels</Loading>
      )
    return (
      <div>
        <h2 className="ui header">Communication Channels</h2>
        {props.channels.map( (c) => (
          <Channel
            key={c.channel} channel={c}
            onUpdate={(data) => this.handleConfigUpdate(c.channel, data)}
            onEnableChange={(state) => this.handleEnableUpdate(c.channel, state)}
            />
        ))}
      </div>
    )
  }
})

export default Notifications
