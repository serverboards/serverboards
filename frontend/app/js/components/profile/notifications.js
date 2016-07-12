import React from 'react'
import GenericForm from '../genericform'
import Loading from '../loading'
import { to_map } from 'app/utils'
import {MarkdownPreview} from 'react-marked-markdown';

let Channel=React.createClass({
  getInitialState(){
    let config = this.props.config || {}
    return { config: config.config, is_active: config.is_active }
  },
  componentWillReceiveProps(props){
    const config=props.config || {}
    this.setState({
      config: config.config,
      is_active: config.is_active
    })
  },
  componentDidMount(){
    $(this.refs.enable).checkbox({
      onChecked: () =>{
        this.setState({ is_active: true })
        this.props.onUpdate(this.state.config, true)
      },
      onUnchecked: () =>{
        this.setState({ is_active: false })
        this.props.onUpdate(this.state.config, false)
      }
    })
  },
  handleUpdate(config){
    this.setState( { config  } )
    this.props.onUpdate(config, this.state.is_active)
  },
  render(){
    const props=this.props
    return (
      <div style={{paddingTop: 15}}>
        <h3 className="ui header">{props.channel.name}
        <div ref="enable" className="ui toggle checkbox" style={{float:"right"}}>
          <input type="checkbox" name="active" defaultChecked={this.state.is_active}/>
          <label>{this.state.is_active ? "Active" : "Disabled"}</label>
        </div>
        </h3>
        <div className="ui meta"><MarkdownPreview value={props.channel.description}/></div>
        <GenericForm
          fields={props.channel.fields}
          updateForm={(data) => this.handleUpdate(data)}
          />
      </div>
    )
  }
})

const Notifications=React.createClass({
  getInitialState(){
    return this.props.config || { config: {}, is_active: false }
  },
  componentWillReceiveProps(props){
    if (props.config != this.props.config){
      this.setState( props.config )
    }
  },
  handleConfigUpdate(chan, config, is_active){
    let state=Object.assign({}, this.state)
    state[chan] = { config, is_active }

    let valid_config={} // there may be invalid configs.
    this.props.channels.map((c) =>{
      valid_config[c.channel]=state[c.channel]
    })

    this.setState( valid_config )

    this.props.onUpdate( valid_config )
  },
  render(){
    const props=this.props
    const state=this.state
    if (!props.channels)
      return (
        <Loading>Notification channels</Loading>
      )
    return (
      <div>
        <h2 className="ui header" style={{marginTop: 30}}>Communication Channels</h2>
        {props.channels.map( (c) => (
          <Channel
            key={c.channel} channel={c} config={state[c.channel]}
            onUpdate={(data, is_active) => this.handleConfigUpdate(c.channel, data, is_active)}
            />
        ))}
      </div>
    )
  }
})

export default Notifications
