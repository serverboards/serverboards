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
      databases: ['template1'],
      tables: [],
      plugin_id: undefined,
    }
  },
  componentDidMount(){
    let plugin_id
    rpc.call("plugin.start",["serverboards.remotesql/daemon"]).then( (pid) => {
      plugin_id=pid
      console.log("plugin id %o", plugin_id)
      this.setState({plugin_id})
      return this.openConnection("template1", plugin_id)
    }).then( () => {
      console.log("plugin id %o", plugin_id)
      return rpc.call(`${plugin_id}.databases`).then( (databases) => {
        this.setState({databases})
      })
    }).catch( (e) => {
      console.error(e)
      Flash.error(String(e))
    })

    $(this.refs.el).find('.ui.dropdown').dropdown()
  },
  componentWillUnmount(){
    console.log("Stop database connection? %o", this.state.plugin_id)
    if (this.state.plugin_id){
      console.log("Stop database connection")
      rpc.call("plugin.stop",[this.state.plugin_id])
    }
  },
  openConnection(database, plugin_id){
    if (!plugin_id)
      plugin_id=this.state.plugin_id
    const c=this.props.service.config
    console.log(this.props.service)
    return rpc.call(`${plugin_id}.open`, {
      via: c.via,
      type: c.type,
      hostname: c.hostname,
      port: c.port,
      username: c.username,
      password_pw: c.password_pw,
      database: database
    }).then( () => rpc.call(`${plugin_id}.tables`)).then( (tables) => {
      this.setState({tables})
    })
  },
  handleExecute(sql, plugin_id){
    if (!plugin_id)
      plugin_id=this.state.plugin_id
    rpc.call(`${plugin_id}.execute`, [sql]).then( (res) => {
      console.log("Got response: %o", res)
      this.setState({data:res.data, columns:res.columns})
    }).catch((e) => {
      console.error(e)
      Flash.error(String(e))
    })
    $(this.refs.el).find('#query_area').val(sql)
  },
  render(){
    const props=this.props
    const state=this.state
    const service=props.service || {}
    return (
      <div ref="el" className="ui container">
        <h2 className="ui header">SQL Console for <i>{service.name}</i></h2>
        <select name="database" defaultValue="template1" className="ui dropdown" onChange={(ev) => this.openConnection(ev.target.value)}>
          {state.databases.map( (db) => (
            <option value={db}>{db}</option>
          ))}
        </select>
        <select name="tables" className="ui dropdown" onChange={(ev) => this.handleExecute(`SELECT * FROM ${ev.target.value} LIMIT 100;`)}>
          {state.tables.map( (db) => (
            <option value={db}>{db}</option>
          ))}
        </select>
        <DataGrid data={state.data} headers={state.columns}/>
        <SQLTextInput onExecute={this.handleExecute}/>
      </div>
    )
  }
})

export default Console
