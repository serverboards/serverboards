const {i18n, rpc, Flash, store, React} = Serverboards
const {Loading} = Serverboards.Components

import View from '../components/add'

// from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

class AddBackup extends React.Component{
  handleAddBackup(backup){
    const uuid = uuidv4()
    rpc
      .call("plugin.data.update", ["serverboards.optional.backups", `${this.props.project}-${uuid}`, backup])
      .then(() => {
        if (backup.schedule.days.length==0){
          Flash.warning(i18n("Added *{name}* backup, but as it has not any day enabled it is effectively disabled", {name: backup.name}))
        }
        else{
          Flash.success(i18n("Backup *{name}* created.", {name: backup.name}))
        }
        const location = store.getState().routing.locationBeforeTransitions.pathname
        store.goto(location.slice(0, location.length-3))
      })
      .catch( e => {
        Flash.error(i18n("Error creating backup:\n\n{e}", {e}))
      })
  }
  render(){
    return (
      <View {...this.props} {...this.state} onAddBackup={(b) => this.handleAddBackup(b)}/>
    )
  }
}

export default AddBackup
