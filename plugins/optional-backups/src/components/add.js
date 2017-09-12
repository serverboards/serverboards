const {i18n, React} = Serverboards
const {Tip} = Serverboards.Components

import Edit from '../containers/edit'

function Add(props){
  return (
    <div className="ui expand two column grid with grey background">
      <div className="ui column">
        <div className="ui  round pane with white background">
          <Tip
            className="padding"
            subtitle={i18n("A project without backups is a disaster waiting to happen.")}
            description={i18n("Add and plan your backups selecting a source of the data, and where are you going to store it.\n\nThere is no recovery functionality just yet, but you should to recovery tests from time to time.\n\nAny failed backup can be configured to create an issue and notify the users, so actions can be done to fix the backup.")}
            />
        </div>
      </div>
      <div className="ui column">
        <div className="ui round pane with white background">
          <Edit {...props}/>
        </div>
      </div>
    </div>
  )
}

export default Add
