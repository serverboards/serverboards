const {i18n, React, utils, cache} = Serverboards
import {calculate_size} from '../utils'
const {MarkdownPreview} = Serverboards.Components
import {get_source_type, get_destination_type} from '../utils'

function TopBar({text, color, onDoBackup, icon}){
  return (
    <div className={`ui attached colored top menu ${color} background`}>
      <div className="ui menu">
        <a onClick={onDoBackup} className={`item ${onDoBackup ? "" : "disabled"}`}>
          <i className={`icon ${icon || "play"}`}/>
        </a>
      </div>
      <h3 className="ui header centered stretch white text">{text}</h3>
    </div>
  )
}

class FutureTemplateLabel extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      template: "...loading...",
      data: props.data
    }
  }
  componentDidMount(){
    this.props.future_template().then( template => this.setState({template}))
    if (this.props.future_data){
      this.props.future_data()
        .then( data => {
          data = utils.merge(this.props.data, data)
          this.setState({data})
        })

    }
  }
  render(){
    return (
      <MarkdownPreview value={utils.templates.render(this.state.template, this.state.data)}/>
    )
  }
}

function Details(props){
  const {backup} = props
  const size = calculate_size(backup.size)
  const section = "details"

  return (
      <div className="ui expand">
        {backup.status == "ok" ? (
          <TopBar
            color="green"
            onDoBackup={() => props.onRunBackup(props.backup)}
            text={i18n("Backup succesfully done")}
            />
        ) : backup.status == "running" ? (
          <TopBar
            color="blue"
            text={i18n("Backup in progress...")}
            icon="stop"
            onDoBackup={() => props.onStopBackup(props.backup)}
            />
        ) : backup.status == "pending" || backup.status == undefined ? (
          <TopBar
            color="yellow"
            onDoBackup={() => props.onRunBackup(props.backup)}
            text={i18n("Pending")}
            />
        ) : (
          <TopBar
            color="red"
            onDoBackup={() => props.onRunBackup(props.backup)}
            text={i18n("Error on backup")}
            />
        )}
        <div className="ui  padding" style={{margin: 0}}>
          <div className="ui floating right">
            {size.size ? (
              <div className="ui centered huge blue text padding top">
                {size.size.toFixed(2)} <span className="ui big text">{size.unit}</span>
              </div>
            ) : (
              <div className="ui centered huge grey text padding top">
                0.00 <span className="ui big text">B</span>
              </div>
            )}
          </div>

          <h2 className="ui header">{backup.name}</h2>
          <MarkdownPreview value={backup.description}/>
          <div className="ui padding top">{i18n("Completed on: ")}<b>{backup.completed_date}</b></div>
        </div>
        <div className="ui divider"/>
        <div className="ui extend with scroll and padding">
          <div>
            <h3 className="ui header" style={{margin:"10px 0 0 0"}}>{i18n("Source")}</h3>
            <FutureTemplateLabel
              key={backup.source.component}
              future_template={() => get_source_type(backup.source.component).then( t => t.extra.resume )}
              data={backup.source.config}
              future_data={() => cache.service( (backup.source.config || {}).service ).then( service => ({service}))}
              />
          </div>
          <div>
            <h3 className="ui header" style={{margin:"10px 0 0 0"}}>{i18n("Destination")}</h3>
            <FutureTemplateLabel
              key={backup.destination.component}
              future_template={() => get_destination_type(backup.destination.component).then( t => t.extra.resume )}
              data={backup.destination.config}
              future_data={() => cache.service( (backup.destination.config || {}).service ).then( service => ({service}))}
              />
          </div>
          <div>
            <h3 className="ui header" style={{margin:"10px 0 0 0"}}>{i18n("Scheduled days")}</h3>
            <div>{backup.schedule.days.map( i => (<span key={i}>{i18n(utils.days[i])} </span>) )}</div>
          </div>
          <div>
            <h3 className="ui header" style={{margin:"10px 0 0 0"}}>{i18n("Time")}</h3>
            <div>{backup.schedule.time}</div>
          </div>
        </div>
      </div>
  )
}

export default Details
