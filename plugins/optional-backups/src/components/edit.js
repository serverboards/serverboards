const {i18n, utils, Flash, React} = Serverboards
const {Tip, GenericForm, MarkdownPreview} = Serverboards.Components
import {get_source_type, get_destination_type} from '../utils'

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
          <input type="checkbox" defaultChecked={this.props.defaultChecked}/>
        </div>
      </div>
    )
  }
}


class AddBackup extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      days: props.backup.schedule.days,
      source: props.backup.source.config,
      destination: props.backup.destination.config,
      source_form: undefined,
      destination_form: undefined,
      source_description: undefined,
      destination_description: undefined
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
    $(this.refs.time).dropdown({allowAdditions: true})

    if (this.props.backup.source)
      this.handleSetSource(this.props.backup.source.component, this.props.backup.source.config)
    if (this.props.backup.destination)
      this.handleSetDestination(this.props.backup.destination.component, this.props.backup.destination.config)
  }
  prepare_backup(){
    const time = this.refs.time.value
    if (!(/\d\d:\d\d/).test(time) ){
      Flash.error(i18n("Invalid time. Must be HH:MM format"))
      return null
    }

    return utils.merge( this.props.backup || {}, {
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
        time
      }
    })
  }
  handleAddBackup(){
    const backup = this.prepare_backup()
    if (backup){
      console.log("Create backup %o", backup)
      this.props.onAddBackup(backup)
    }
  }
  handleUpdateBackup(){
    const backup = this.prepare_backup()

    if (backup){
      console.log("Update backup %o", backup)
      this.props.onUpdateBackup(backup)
    }
  }
  handleSetSource(id, data){
    console.log("Set source %s", id, data)
    get_source_type(id)
      .then( s => {
        this.setState({
            source_form: s.extra.params,
            source_description: s.description
          })
        if (data)
          this.setState({source: data})
      }).catch( () => this.setState({source_form: [], source_description: ""}) )
  }
  handleSetDestination(id, data){
    console.log("Set destination %s", id, data)
    get_destination_type(id)
      .then( s => {
        this.setState({
          destination_form: s.extra.params,
          destination_description: s.description
        })
        if (data)
          this.setState({destination: data})
      }).catch( () => this.setState({destination_form: [], destination_description: ""}) )
  }
  render(){
    const props=this.props
    const backup = props.backup || { schedule: { days: [], time: "03:00"} }
    return (
      <div className="ui expand">
        <h2 className="ui centered header padding">{i18n("Create a new backup.")}</h2>
        <div className="ui form with padding and scroll">
          <div className="field">
            <label>{i18n("Name of this backup")}</label>
            <input
              className="ui text input" type="text" ref="name"
              placeholder={i18n("Memorable backup name")}
              defaultValue={backup.name}
              />
          </div>

          <div style={{paddingTop: 20}}/>
          <div className="field">
            <label>{i18n("Source")}</label>
            <select ref="sources" defaultValue={backup.source.component} onChange={(ev) => this.handleSetSource(ev.target.value)}>
                <option>{i18n("Select a source type")}</option>
              {props.sources.map( s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {this.state.source_form && (
            <div className="ui left padding">
              <div className="ui meta">
                <MarkdownPreview value={this.state.source_description}/>
              </div>
              <GenericForm
                fields={this.state.source_form}
                data={this.state.source}
                updateForm={(source) => this.setState({source})}
                />
            </div>
          )}

          <div style={{paddingTop: 40}}/>
          <div className="field">
            <label>{i18n("Destination")}</label>
            <select ref="destination" defaultValue={backup.destination.component} onChange={(ev) => this.handleSetDestination(ev.target.value)}>
              <option>{i18n("Select destination type")}</option>
              {props.destinations.map( s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {this.state.destination_form && (
            <div className="ui left padding">
              <div className="ui meta">
                <MarkdownPreview value={this.state.destination_description}/>
              </div>
              <GenericForm
                fields={this.state.destination_form}
                data={this.state.destination}
                updateForm={(destination) => this.setState({destination})}
                />
            </div>
          )}

          <div style={{paddingTop: 20}}/>
          <div className="field">
            <label>{i18n("Schedule")}</label>
            <div ref="schedule_days" style={{display:"flex", justifyContent:"space-between"}}>
              <DayLabel label={i18n("Monday")} defaultChecked={backup.schedule.days.includes(0)} onChange={(onoff) => this.toggleDay(0, onoff)}/>
              <DayLabel label={i18n("Tuesday")} defaultChecked={backup.schedule.days.includes(1)} onChange={(onoff) => this.toggleDay(1, onoff)}/>
              <DayLabel label={i18n("Wednesday")} defaultChecked={backup.schedule.days.includes(2)} onChange={(onoff) => this.toggleDay(2, onoff)}/>
              <DayLabel label={i18n("Thursday")} defaultChecked={backup.schedule.days.includes(3)} onChange={(onoff) => this.toggleDay(3, onoff)}/>
              <DayLabel label={i18n("Friday")} defaultChecked={backup.schedule.days.includes(4)} onChange={(onoff) => this.toggleDay(4, onoff)}/>
              <DayLabel label={i18n("Saturday")} defaultChecked={backup.schedule.days.includes(5)} onChange={(onoff) => this.toggleDay(5, onoff)}/>
              <DayLabel label={i18n("Sunday")} defaultChecked={backup.schedule.days.includes(6)} onChange={(onoff) => this.toggleDay(6, onoff)}/>
            </div>
            <label>{i18n("Time")}</label>
            <select ref="time" defaultValue={backup.schedule.time || "03:00"} className="search">
              {!TIMES.includes(backup.schedule.time) && (
                <option key={backup.schedule.time} value={backup.schedule.time}>{backup.schedule.time}</option>
              )}
              {TIMES.map( t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>{i18n("Description and comments")}</label>
            <textarea
              ref="description" className="ui text input" type="text"
              placeholder={i18n("Description and random notes about the backup and its history.")}
              defaultValue={backup.description}
              />
          </div>

          <div className="ui floating right">
            { props.onAddBackup ? (
              <button className="ui button teal" onClick={this.handleAddBackup.bind(this)}>{i18n("Create backup")}</button>
            ) : (
              <button className="ui button teal" onClick={this.handleUpdateBackup.bind(this)}>{i18n("Update backup")}</button>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default AddBackup
