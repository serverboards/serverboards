import {basename, hex, old_backup, get_servername} from './utils'
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
    console.log(f, f.file_expression + "-" + f.service_uuid)
    var to_check = new TextEncoder("utf-8").encode(f.file_expression + "-" + f.service_uuid);
    crypto.subtle.digest("SHA-256", to_check).then( (sha) => {
      var key="test-"+hex(sha)
      console.log(key)
      return rpc.call("plugin.data_get",[plugin_id, key])
    } ).then( (data) => {
      if (!data.filename){
        this.setState({
          color: "red",
          state: "Cant get data from any backup. Maybe not performed yet?"
        })
        return;
      }
      console.log(data)
      const is_old = old_backup(data.datetime)
      this.setState({
        filename: data.filename,
        datetime: data.datetime.slice(0,16).replace('T',' '),
        color: is_old ? "red" : "green",
        state: is_old ? "Old backup. Check ASAP" : "Ok",
        size: data.size,
      })
    }).catch((e) => {
      console.error(e)
      this.setState({
        color: "red",
        state: e.toString()
      })
    })
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
