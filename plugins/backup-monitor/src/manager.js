const { React, rpc } = Serverboards
const plugin_id = 'serverboards.backup.monitor'
import { get_state } from './utils'
import EditFileRow from './rulerow'

function by_when(A, B){
  return A.when.localeCompare( B.when, undefined, {numeric: true} )
}

const Manager=React.createClass({
  getInitialState(){
    const services = this.props.serverboard.services.filter( (s) => s.type == "serverboards.core.ssh/ssh" )
    return {
      services: services,
      rules: []
    }
  },
  componentDidMount(){
    this.reload_rules()
  },
  reload_rules(){
    rpc.call("rules.list", {serverboard:this.props.serverboard.shortname}).then( (all_rules) => {
      const rules = all_rules
        .filter( (r) => r.trigger.trigger == `${plugin_id}/file_exists` )
        .map( (r) => ({
          file_expression: r.trigger.params.file_expression,
          service: r.service,
          when: r.trigger.params.when,
          uuid: r.uuid,
          description: r.description,
          name: r.name,
          is_active: r.is_active,
          actions: r.actions
        }))
      this.setState({rules})
    })
  },
  handleAddRule(){
    rpc.call("rules.update",{
      trigger: {
        trigger: `${plugin_id}/file_exists`,
        params: { file_expression:"", when: "7am" },
      },
      actions: [],
      serverboard: this.props.serverboard.shortname,
    }).then( () => {
      this.reload_rules()
    })
  },
  render(){
    const props=this.props
    const state=this.state

    return (
      <div className="ui central container">
        <h1 className="ui header">Backup Monitor Manager</h1>
        <div className="ui meta">Easy manage the backup watchers rules. </div>

        <table className="ui table">
          <thead>
            <tr>
              <th/>
              <th/>
              <th>Service</th>
              <th>File path</th>
              <th>Check time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {state.rules.sort(by_when).map( (r) => (
              <EditFileRow rule={r} services={state.services} serverboard={props.serverboard} handleReload={this.reload_rules}/>
            ))}
          </tbody>
        </table>
        <button className="ui yellow button">Update backup rules changes</button>

        <a onClick={this.addRow} className="ui massive button _add icon floating green" onClick={this.handleAddRule}>
          <i className="add icon"></i>
        </a>

      </div>
    )
  }
})

function main(el, config){
  Serverboards.ReactDOM.render(React.createElement(Manager, {serverboard: config.serverboard}), el)

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(el)
  }
}

Serverboards.add_screen(plugin_id+"/manager", main)
