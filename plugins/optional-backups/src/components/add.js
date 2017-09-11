const {i18n, React} = Serverboards
const {Tip} = Serverboards.Components

class DayLabel extends React.Component{
  componentDidMount(){
    let self=this
    $(this.refs.toggle).checkbox({
      onChecked(){ self.props.onChange(true) },
      onUnchecked(){ self.props.onChange(false) }
    })
  }
  render(){
    return (
      <div className="field">
        <label>{this.props.label}</label>
        <div className="ui toggle checkbox field" ref="toggle">
          <label/>
          <input type="checkbox"/>
        </div>
      </div>
    )
  }
}


class AddBackup extends React.Component{
  componentDidMount(){
    $(this.refs.sources).dropdown()
    $(this.refs.destinations).dropdown()
  }
  handleAddBackup(){
    const backup = {
      name: this.refs.name.value,
      description: this.refs.name.value,
      source: undefined
    }
  }
  render(){
    const props=this.props
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
          <div className="ui  round pane with white background padding">
            <h2 className="ui centered header padding">{i18n("Create a new backup.")}</h2>
            <div className="ui form">
              <div className="field">
                <label>{i18n("Name of this backup")}</label>
                <input className="ui text input" type="text" placeholder={i18n("Memorable backup name")}/>
              </div>

              <div className="field">
                <label>{i18n("Source")}</label>
                <select ref="sources">
                  {props.sources.map( s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{i18n("Destination")}</label>
                <select ref="destinations">
                  {props.destinations.map( s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{i18n("Schedule")}</label>
                <div ref="schedule_days" style={{display:"flex", justifyContent:"space-between"}}>
                  <DayLabel label={i18n("Monday")} onChange={(monday) => this.setState({monday})}/>
                  <DayLabel label={i18n("Tuesday")} onChange={(tuesday) => this.setState({tuesday})}/>
                  <DayLabel label={i18n("Wednesday")} onChange={(wednesday) => this.setState({wednesday})}/>
                  <DayLabel label={i18n("Thursday")} onChange={(thursday) => this.setState({thursday})}/>
                  <DayLabel label={i18n("Friday")} onChange={(friday) => this.setState({friday})}/>
                  <DayLabel label={i18n("Saturday")} onChange={(saturday) => this.setState({saturday})}/>
                  <DayLabel label={i18n("Sunday")} onChange={(sunday) => this.setState({sunday})}/>
                </div>
              </div>

              <div className="field">
                <label>{i18n("Description and comments")}</label>
                <textarea className="ui text input" type="text" placeholder={i18n("Description and random notes about the backup and its history.")}/>
              </div>

              <div className="ui floating right">
                <button className="ui button teal" onClick={this.handleAddBackup.bind(this)}>{i18n("Create backup")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default AddBackup
