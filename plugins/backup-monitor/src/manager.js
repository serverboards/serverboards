const { React, rpc } = Serverboards
const plugin_id = 'serverboards.backup.monitor'
import { get_state } from './utils'

const EditFileRow = React.createClass({
  getInitialState(){
    let action='custom'
    if (this.props.rule.actions.exists.action=='serverboards.core.actions/set_label')
      action='labels'
    if (this.props.rule.actions['not-exists'].action=='serverboards.core.actions/send_notification')
      action='notification'

    return {
      color: this.props.rule.is_active ? 'yellow' : 'grey',
      state: 'Checking status',
      action: action
    }
  },
  componentDidMount(){
    $(this.refs.services).dropdown()
    $(this.refs.actions).dropdown()

    get_state(this.props.rule).then( (state) => {
      this.setState({color: state.color, state: state.state})
    })
  },
  get_actions(action_name){
    // Only will change if modified
    let actions = this.props.rule.actions
    if (action_name != this.state.action){
      switch(action_name){
        case 'labels':
          actions={
            exists:{
              action:'serverboards.core.actions/set_label',
              params:{
                labels: "-BACKUP_FAIL"
              }
            },
            "not-exists":{
              action:'serverboards.core.actions/set_label',
              params:{
                labels: "BACKUP_FAIL"
              }
            }
          }
        break;
        case 'notification':
          {
            const $el=$(this.refs.el)
            const service = $el.find('[name=service]').val()
            const file_expression = $el.find('[name=file_expression]').val()
            actions={
              "not-exists":{
                action:'serverboards.core.actions/send_notification',
                params:{
                  title: "Backup was not properly performed",
                  email: "@user",
                  body: `Backup at ${this.props.services.find( (s) => s.uuid == service ).name}, file ${file_expression} failed.\n\nPlease check ASAP.`
                }
              }
            }
          break;
        }
      }
    }
    return actions
  },
  saveChanges(){
    const $el=$(this.refs.el)
    const status={
      service: $el.find('[name=service]').val(),
      file_expression: $el.find('[name=file_expression]').val(),
      when: $el.find('[name=when]').val(),
      action: $el.find('[name=action]').val(),
    }

    {
      const rule = this.props.rule
      if (
          status.service == rule.service &&
          status.file_expression == rule.file_expression &&
          status.when == rule.when &&
          status.action == this.state.action
        )
          return; // Nothing changed
    }

    const props=this.props

    let actions=this.get_actions(status.action)

    let rule={
      uuid: props.rule.uuid,
      is_active: true,
      name: props.rule.name || "Remote file check",
      description: props.rule.description,
      service: status.service,
      serverboard: props.serverboard.shortname,
      trigger: {
        trigger: `${plugin_id}/file_exists`,
        params: {
          file_expression: status.file_expression,
          when: status.when
        }
      },
      actions: actions
    }

    this.setState({color: "grey"})
    rpc.call("rules.update", rule).then( () => {
      this.setState({color: "yellow"})
      return get_state({file_expression: status.file_expression, service: status.service})
    }).then( (state) => {
      console.log("Got state: %o", state)
      this.setState({ color: state.color, state: state.state })
    }
    ).catch( (e) => {
      Serverboards.Flash.error("Error updating rule")
    })
  },
  render(){
    const props=this.props
    const state=this.state
    return (
      <tr className="ui form" ref="el">
        <td><i className={`ui circular ${state.color} small label`} data-tooltip={state.state}/></td>
        <td>
          <select ref="services" name="service" className="ui dropdown" defaultValue={props.rule.service} onChange={this.saveChanges}>
            {this.props.services.map( (s) => (
              <option value={s.uuid}>{s.name}</option>
            ))}
          </select>
        </td>
        <td className="ui field" style={{width: "36em"}}>
          <input type="text" name="file_expression" className="ui field" defaultValue={props.rule.file_expression}  onBlur={this.saveChanges}/>
        </td>
        <td className="ui field" style={{width: "8em"}}>
          <input type="text" name="when" className="ui field" defaultValue={props.rule.when}  onBlur={this.saveChanges}/>
        </td>
        <td>
          <select ref="actions" name="action" defaultValue={state.action} onChange={this.saveChanges}>
            <option value="custom">Custom</option>
            <option value="labels">Set service labels</option>
            <option value="notification">Send notification</option>
          </select>
        </td>
      </tr>
    )
  }
})

const Manager=React.createClass({
  getInitialState(){
    const services = this.props.serverboard.services.filter( (s) => s.type == "serverboards.core.ssh/ssh" )
    return {
      services: services,
      rules: []
    }
  },
  componentDidMount(){
    rpc.call("rules.list", {serverboard:this.props.serverboard.shortname}).then( (all_rules) => {
      console.log("all rules", all_rules)
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
  render(){
    const props=this.props
    const state=this.state

    console.log(props, state)
    return (
      <div className="ui central container">
        <h1 className="ui header">Backup Monitor Manager</h1>
        <div className="ui meta">Easy manage the backup watchers rules. </div>

        <table className="ui table">
          <thead>
            <tr>
              <th/>
              <th>Service</th>
              <th>File path</th>
              <th>Check time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {state.rules.map( (r) => (
              <EditFileRow rule={r} services={state.services} serverboard={props.serverboard}/>
            ))}
          </tbody>
        </table>
        <button className="ui yellow button">Update backup rules changes</button>

        <a onClick={this.addRow} className="ui massive button _add icon floating green">
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
