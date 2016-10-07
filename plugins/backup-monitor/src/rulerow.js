const { React, rpc } = Serverboards
const plugin_id = 'serverboards.backup.monitor'
import { get_state } from './utils'

const LABEL_ACTION='serverboards.core.actions/set-tags'

const EditFileRow = React.createClass({
  getInitialState(){
    let action='custom'
    if (this.props.rule.actions && this.props.rule.actions.length !=0 ){
      if (this.props.rule.actions.exists && this.props.rule.actions.exists.action==LABEL_ACTION)
        action='labels'
      if (this.props.rule.actions['not-exists'] && this.props.rule.actions['not-exists'].action=='serverboards.core.actions/send_notification')
        action='notification'
    }

    return {
      color: this.props.rule.is_active ? 'yellow' : 'grey',
      state: 'Checking status',
      action: action
    }
  },
  componentDidMount(){
    $(this.refs.services).dropdown()
    $(this.refs.actions).dropdown()
    $(this.refs.checkbox).checkbox({
       onChange: this.saveChanges
    })

    get_state(this.props.rule).then( (state) => {
      this.setState({color: this.props.rule.is_active ? state.color : "grey", state: state.state})
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
              action:LABEL_ACTION,
              params:{
                tags: "-BACKUP_FAIL"
              }
            },
            "not-exists":{
              action:LABEL_ACTION,
              params:{
                tags: "BACKUP_FAIL"
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
      is_active: $el.find('[name=is_active]').is(':checked')
    }

    {
      const rule = this.props.rule
      if (
          status.service == rule.service &&
          status.file_expression == rule.file_expression &&
          status.when == rule.when &&
          status.action == this.state.action &&
          status.is_active == rule.is_active
        )
          return; // Nothing changed
    }

    const props=this.props

    let actions=this.get_actions(status.action)

    let rule={
      uuid: props.rule.uuid,
      name: props.rule.name || "Remote file check",
      description: props.rule.description,
      is_active: status.is_active,
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

    this.setState({color: "blue"})
    rpc.call("rules.update", rule).then( () => {
      this.setState({color: "yellow"})
      return get_state({file_expression: status.file_expression, service: status.service})
    }).then( (state) => {
      this.props.handleReload()
      this.setState({ color: rule.is_active ? state.color : "grey", state: state.state })
    }
    ).catch( (e) => {
      console.log(e)
      Serverboards.Flash.error("Error updating rule")
    })
  },
  render(){
    const props=this.props
    const state=this.state
    return (
      <tr className="ui form" ref="el">
        <td><i className={`ui circular ${state.color} small label`} data-tooltip={state.state}/></td>
        <td><div ref="checkbox" className="ui checkbox toggle"><input type="checkbox" name="is_active" defaultChecked={props.rule.is_active}/></div></td>
        <td>
          <select ref="services" name="service" className="ui dropdown" defaultValue={props.rule.service} onChange={this.saveChanges}>
            <option value="">No service selected yet</option>
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

export default EditFileRow
