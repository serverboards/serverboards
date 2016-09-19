import {basename, hex, get_state, get_servername} from './utils'
const {React, rpc} = Serverboards

const plugin_id = 'serverboards.backup.monitor'

const Widget = Serverboards.React.createClass({
  getInitialState(){
    return {
      files:[]
    }
  },
  componentDidMount(){
    rpc.call("rules.list", {serverboard: this.props.config.serverboard.shortname}).then( (list) => {
      const files = list
        .filter( (el) => el.trigger.trigger == `${plugin_id}/file_exists` )
        .map( (el) => ({
          is_active: el.is_active,
          file_expression: el.trigger.params.file_expression,
          service_uuid: el.service,
          uuid: el.uuid
        }))
      this.setState({files})
    })
  },
  render(){
    const props=this.props
    const state=this.state

    return (
      <table className="ui very basic selectable table">
        <tbody>
          {state.files.map( (f) => (
            <BackupFileRow file={f}/>
          ))}
        </tbody>
      </table>
    )
  }
})


const BackupFileRow = React.createClass({
  getInitialState(){
    const f = this.props.file
    return {
      servername: undefined,
      filename: f.file_expression,
      datetime: undefined,
      color: f.is_active ? 'yellow' : 'grey',
      state: f.is_active ? 'Gathering information' : 'Not active',
      size: undefined,
    }
  },
  componentDidMount(){
    const f=this.props.file
    get_servername(this.props.file.service_uuid).then( (servername) => {
      this.setState({servername})
    })
    get_state(f).then( (state) => this.setState(state) )
  },
  render(){
    const state = this.state
    return (
      <tr style={{cursor:"pointer"}}>
        <td data-tooltip={state.state} title={state.state} style={{paddingLeft:5}}>
          <i className={`ui label circular small ${state.color}`}/>
        </td>
        <td style={{padding: "10px 0"}}>
          <div
            className="ui oneline"
            data-tooltip={state.filename}
            title={state.filename}
            style={{maxWidth: 150}}
            >
            {basename(state.filename || '')}
          </div>
          <div className="ui meta">{state.servername}</div>
        </td>
        <td>
          <div className="ui oneline" style={{fontSize:"0.8em"}}>{state.datetime}</div>
          <b>{state.size ? `${state.size.toFixed(2)} MB` : ''}</b>
        </td>
      </tr>
    )
  }
})

function main(el, config){
  Serverboards.ReactDOM.render(React.createElement(Widget, {config}), el)

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(el)
  }
}

Serverboards.add_widget(plugin_id+"/watcher", main)
