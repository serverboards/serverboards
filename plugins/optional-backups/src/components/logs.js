const {React} = Serverboards
const {Logs} = Serverboards.Components

function BackupLogs(props){
  const {backup} = props

  return (
    <div className="expand">
      <div className="ui top attached header small">
        {backup.name}
      </div>
      <Logs filter={{extra:{backup: backup.id}}}/>
    </div>
  )
}

export default BackupLogs
