const {store, i18n, rpc, utils, event, Flash, React} = Serverboards
const {Error, Loading} = Serverboards.Components

import BackupMenu from '../components/menu'
import View from '../components/list'
import Add from '../containers/add'

class List extends React.Component{
    constructor(props){
      super(props)
      this.state={
        current: undefined,
        backups: undefined
      }
      this.updateBackupFromCore = (backup) => {
        console.log("Got backup update %o", backup)
        const backups = this.state.backups.map( b => b.id==backup.id ? backup : b )
        this.setState({backups})
      }
    }
    componentDidMount(){
      this.props.setSectionMenu(BackupMenu)
      rpc
        .call("plugin.data.items", ["serverboards.optional.backups", `${this.props.project}-`])
        .then( backups =>
            this.setState({
                backups: backups.map( idb => {
                  let id = idb[0]
                  const b = idb[1]
                  return utils.merge(b, { id })
                }  )
            } ) )
      console.log("Subscribe to ", `serverboards.core.backup.updated[${this.props.project}]`)
      event
        .on(`serverboards.core.backup.updated[${this.props.project}]`, this.updateBackupFromCore)
    }
    componentWillUnmount(){
      console.log("Desubscribing from changes")
      event.off(`serverboards.core.backup.updated[${this.props.project}]`, this.updateBackupFromCore)
    }
    updateBackup(backup){
      let backups = this.state.backups.map(
        b => (b.id == backup.id) ? backup : b
      )
      this.setState({backups})
    }
    handleRunBackup(backup){
      console.log("Run backup %o", backup)
      rpc.call("action.trigger", ["serverboards.optional.backups/backup.now", {backup: backup.id}])
        .then(() => Flash.success(i18n("Starting *{name}* backup", {name: backup.name})))
        .catch( e => Flash.error(i18n("Error starting backup *{name}*: {e}", {name: backup.name, e})))
    }
    render(){
      const mode = store.getState().routing.locationBeforeTransitions.pathname.endsWith("/add")  ? "add" : "list"

      switch(mode){
        case "list":
          if (this.state.backups==undefined){
            return (<Loading>{i18n("Backups")}</Loading>)
          }
          return (
            <View
              {...this.props}
              backups={this.state.backups}
              current={this.state.current}
              setCurrent={(current) => this.setState({current})}
              updateBackup={this.updateBackup.bind(this)}
              onRunBackup={this.handleRunBackup}
              />
          )
        case "add":
          return (
            <Add {...this.props}/>
          )
        default:
          return (
            <Error>{i18n("Unknown view")}</Error>
          )
      }
    }
}

export default List
