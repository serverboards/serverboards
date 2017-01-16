const {React, plugin, Flash} = Serverboards
import View from '../views/list'
import EditAction from './editaction'
const {Modal} = Serverboards.Components.Modal
const {merge} = Serverboards.utils

const extra={
  actions: [
    { id: 1, action: "serverboards.core.actions/webhook.call", description: "This is a description", params: { url: "https://serverboards.io" }, name: "Call serverboards.io", confirmation: false },
    { id: 2, action: "serverboards.core.ssh/exec", params: { command: "service nginx restart" }, name: "Restart NGINX", service: "b3fc12ee-cecd-4cf0-b10f-760630478fd7", confirmation: true, icon: "play" },
    { id: 3, action: "serverboards.core.ssh/exec", params: { command: "reboot" }, name: "Restart", service: "fcdfdf22-1ac6-4baa-81ad-d5ac94308b72", confirmation: true, icon: "undo", description: "Reboots the server." },
    { id: 4, action: "serverboards.core.ssh/exec", params: { command: "halt" }, name: "Halt", service: "b3fc12ee-cecd-4cf0-b10f-760630478fd7", confirmation: true, icon: "stop" },
    { id: 5, action: "serverboards.core.ssh/exec", params: { command: "dnf update -y" }, name: "Update", service: "b3fc12ee-cecd-4cf0-b10f-760630478fd7", confirmation: true, icon: "paint brush" },
    { id: 6, action: "serverboards.core.actions/webhook.call", params: { url: "https://serverboards.io" }, name: "Call serverboards.io", confirmation: false },
    { id: 7, action: "serverboards.core.ssh/exec", params: { command: "service nginx restart" }, name: "Restart NGINX", service: "b3fc12ee-cecd-4cf0-b10f-760630478fd7", confirmation: true },
    { id: 8, action: "serverboards.core.ssh/exec", params: { command: "reboot" }, name: "Restart", service: "fcdfdf22-1ac6-4baa-81ad-d5ac94308b72", confirmation: true },
    { id: 9, action: "serverboards.core.ssh/exec", params: { command: "halt" }, name: "Halt", service: "fcdfdf22-1ac6-4baa-81ad-d5ac94308b72", confirmation: true },
    { id: 10, action: "serverboards.core.ssh/exec", params: { command: "dnf update -y" }, name: "Update", service: "b3fc12ee-cecd-4cf0-b10f-760630478fd7", confirmation: true },
    { id: 11, action: "serverboards.core.actions/webhook.call", params: { url: "https://serverboards.io" }, name: "Call serverboards.io", confirmation: false },
    { id: 12, action: "serverboards.core.ssh/exec", params: { command: "service nginx restart" }, name: "Restart NGINX", service: "3db4e1d1-4ce9-44ac-9b4e-2d27a9a65275", confirmation: true },
    { id: 13, action: "serverboards.core.ssh/exec", params: { command: "reboot" }, name: "Restart", service: "3db4e1d1-4ce9-44ac-9b4e-2d27a9a65275", confirmation: true },
    { id: 14, action: "serverboards.core.ssh/exec", params: { command: "halt" }, name: "Halt", service: "b3fc12ee-cecd-4cf0-b10f-760630478fd7", confirmation: true },
    { id: 15, action: "serverboards.core.ssh/exec", params: { command: "dnf update -y" }, name: "Update", service: "3db4e1d1-4ce9-44ac-9b4e-2d27a9a65275", confirmation: true },
  ],
  empty_action: {
    id: undefined,
    action: undefined,
    description: "",
    params: {  },
    name: "",
    confirmation: false
  },
}
const ListModel=React.createClass({
  getInitialState(){
    return {
      edit: undefined,
      actions: undefined
    }
  },
  componentDidMount(){
    plugin.start_call_stop(`serverboards.optional.quickactions/command`, "list_actions", {}).then( actions => {
      console.log("got actions: %o", actions)
      this.setState({actions})
    })
  },
  handleRunAction(a){
    if (a.confirmation){
      if (!confirm(a.name + "\n\n" + (a.description || a.confirm || "Are you sure?")))
        return;
    }
    plugin.start_call_stop(`serverboards.optional.quickactions/command`, "run_action", [a.id]).then( () => {
      Flash.info("Sucefully run action "+a.name)
    }).catch( e => Flash.error(e) )
  },
  handleConfigureAction(a){
    this.setState({edit: a})
  },
  handleAcceptEditAction(a){
    plugin.start_call_stop(`serverboards.optional.quickactions/command`, "update_action", [a]).then( (id) => {
      const actions = this.state.actions.map( (ac) => {
        if (ac.id == a.id){
          return a
        }
        return ac
      })
      this.setState({edit: undefined, actions})
      Flash.info("Action updated")
    }).catch( e => Flash.error(e) )
  },
  handleCloseEditAction(){
    this.setState({edit: undefined})
  },
  handleOpenAddAction(){
    this.setState({edit: "add"})
  },
  handleAcceptAddAction(a){
    plugin.start_call_stop(`serverboards.optional.quickactions/command`, "add_action", [a]).then( (id) => {
      Flash.info("Action added")
      this.setState({actions: this.state.actions.concat(merge(a, {id})), edit: undefined})
    }).catch( e => Flash.error(e) )
  },
  render(){
    if (this.state.edit){
      if (this.state.edit=="add")
        return (
          <EditAction action={extra.empty_action} onAccept={this.handleAcceptAddAction} services={this.props.services} onClose={this.handleCloseEditAction}/>
        )
      else
        return (
          <EditAction action={this.state.edit} onAccept={this.handleAcceptEditAction} services={this.props.services} onClose={this.handleCloseEditAction}/>
        )
    }
    return (
      <View {...this.props} {...this.state}
        onRunAction={this.handleRunAction}
        onConfigureAction={this.handleConfigureAction}
        onOpenAddAction={this.handleOpenAddAction}
        />
    )
  }
})

export default ListModel
