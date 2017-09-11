const {i18n, React} = Serverboards
const {Tip} = Serverboards.Components

const TIMES = [
  "01:00", "01:15", "01:30", "01:45",  "02:00", "02:15", "02:30", "02:45",
  "03:00", "03:15", "03:30", "03:45",  "04:00", "04:15", "04:30", "04:45",
  "05:00", "05:15", "05:30", "05:45",  "06:00", "06:15", "06:30", "06:45",

  "07:00", "07:15", "07:30", "07:45",  "08:00", "08:15", "08:30", "08:45",
  "09:00", "09:15", "09:30", "09:45",  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",  "12:00", "12:15", "12:30", "12:45",

  "13:00", "13:15", "13:30", "13:45",  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",  "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45",  "18:00", "18:15", "18:30", "18:45",

  "19:00", "19:15", "19:30", "19:45",  "20:00", "20:15", "20:30", "20:45",
  "21:00", "21:15", "21:30", "21:45",  "22:00", "22:15", "22:30", "22:45",
  "23:00", "23:15", "23:30", "23:45",  "00:00", "00:15", "00:30", "00:45",
]

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
  constructor(props){
    super(props)
    this.state = {
      days: [],
      source: {},
      destination: {}
    }
  }
  toggleDay(n, on){
    let days = this.state.days
    if (on){
      days=days.concat(n)
    }
    else{
      days=days.filter( d => d!=n )
    }
    this.setState({days})
  }
  componentDidMount(){
    $(this.refs.sources).dropdown()
    $(this.refs.destination).dropdown()
    $(this.refs.time).dropdown()
  }
  handleAddBackup(){
    const backup = {
      name: this.refs.name.value,
      description: this.refs.description.value,
      source: {
        component: this.refs.sources.value,
        config: this.state.source,
      },
      destination: {
        component: this.refs.destination.value,
        config: this.state.destination,
      },
      schedule:{
        days: this.state.days,
        time: this.refs.time.value
      }
    }
    console.log("Create backup %o", backup)
    this.props.onAddBackup(backup)
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
                <input className="ui text input" type="text" ref="name" placeholder={i18n("Memorable backup name")}/>
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
                <select ref="destination">
                  {props.destinations.map( s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{i18n("Schedule")}</label>
                <div ref="schedule_days" style={{display:"flex", justifyContent:"space-between"}}>
                  <DayLabel label={i18n("Monday")} onChange={(onoff) => this.toggleDay(1, onoff)}/>
                  <DayLabel label={i18n("Tuesday")} onChange={(onoff) => this.toggleDay(2, onoff)}/>
                  <DayLabel label={i18n("Wednesday")} onChange={(onoff) => this.toggleDay(3, onoff)}/>
                  <DayLabel label={i18n("Thursday")} onChange={(onoff) => this.toggleDay(4, onoff)}/>
                  <DayLabel label={i18n("Friday")} onChange={(onoff) => this.toggleDay(5, onoff)}/>
                  <DayLabel label={i18n("Saturday")} onChange={(onoff) => this.toggleDay(6, onoff)}/>
                  <DayLabel label={i18n("Sunday")} onChange={(onoff) => this.toggleDay(7, onoff)}/>
                </div>
                <label>{i18n("Time")}</label>
                <select ref="time" defaultValue={"03:00"}>
                  {TIMES.map( t => (
                    <option value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{i18n("Description and comments")}</label>
                <textarea ref="description" className="ui text input" type="text" placeholder={i18n("Description and random notes about the backup and its history.")}/>
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
