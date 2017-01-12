const {React} = Serverboards
import View from '../views/list'
import EditAction from './editaction'
const {Modal} = Serverboards.Components.Modal

const extra={
  actions: [
    { id: 1, action: "serverboards.core.actions/webhook.call", params: { url: "https://serverboards.io" }, name: "Call serverboards.io", confirmation: false },
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
  ]
}
const ListModel=React.createClass({
  getInitialState(){
    return {
      edit: undefined
    }
  },
  handleRunAction(a){
    if (a.confirmation){
      if (!confirm(a.name + "\n\n" + (a.description || a.confirm || "Are you sure?")))
        return;
    }
    console.log(a)
  },
  handleConfigureAction(a){
    this.setState({edit: a})
  },
  handleAcceptEditAction(a){
    this.setState({edit: undefined})
  },
  handleCloseEditAction(){
    this.setState({edit: undefined})
  },
  render(){
    if (this.state.edit){
      return (
        <EditAction action={this.state.edit} onAccept={this.handleAcceptEditAction} services={this.props.services} onClose={this.handleCloseEditAction}/>
      )
    }
    return (
      <View {...this.props} {...extra} onRunAction={this.handleRunAction} onConfigureAction={this.handleConfigureAction}/>
    )
  }
})

export default ListModel
