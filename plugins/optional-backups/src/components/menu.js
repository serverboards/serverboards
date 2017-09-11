const {i18n, React} = Serverboards

function BackupMenu({onAddBackup}){
  return (
    <div className="menu">
      <span className="item stretch"/>
      <a className="ui button teal" onClick={onAddBackup}>{i18n("Add backup job")}</a>
    </div>
  )
}


export default BackupMenu
