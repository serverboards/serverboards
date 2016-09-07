const React = Serverboards.React
const rpc = Serverboards.rpc
const Flash = Serverboards.Flash

import SQLTextInput from './sqltextinput'
import DataGrid from './datagrid'

const Console=React.createClass({
  getInitialState(){
    return {
      data:[
      ],
      columns:["","",""],
      plugin_id: undefined,
    }
  },
  componentDidMount(){
    rpc.call("plugin.start",["serverboards.remotesql/daemon"]).then( (plugin_id) => {
      console.log("plugin id %o", plugin_id)
      this.setState({plugin_id: plugin_id})
      return this.openConnection("serverboards", plugin_id)
    }).catch( (e) => {
      console.error(e)
      Flash.error(String(e))
    })
  },
  openConnection(database, plugin_id){
    if (!plugin_id)
      plugin_id=this.state.plugin_id
    const c=this.props.service.config
    return rpc.call(`${plugin_id}.open`, {
      via: c.via,
      type: c.type,
      hostname: c.hostname,
      port: c.port,
      username: c.username,
      password_pw: c.password_pw,
      database: database
    })
  },
  handleExecute(sql, plugin_id){
    if (!plugin_id)
      plugin_id=this.state.plugin_id
    console.log("Execute at %s: %s", plugin_id, sql)
    rpc.call(`${plugin_id}.execute`, [sql]).then( (res) => {
      console.log("Got response: %o", res)
      this.setState({data:res.data, columns:res.columns})
    }).catch((e) => {
      console.error(e)
      Flash.error(String(e))
    })
  },
  render(){
    const props=this.props
    const state=this.state
    const service=props.service || {}
    console.log(this)
    return (
      <div className="ui container">
        <h2 className="ui header">SQL Console for <i>{service.name}</i></h2>
        <DataGrid data={state.data} headers={state.columns}/>
        <SQLTextInput onExecute={this.handleExecute}/>
      </div>
    )
  }
})

export default Console
