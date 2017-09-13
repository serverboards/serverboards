const {i18n, React, utils} = Serverboards
import {calculate_size} from '../utils'
const {MarkdownPreview} = Serverboards.Components

function TopBar({text, color, onDoBackup}){
  return (
    <div className={`ui attached colored top menu ${color} background`}>
      <div className="ui menu">
        <a onClick={onDoBackup} className={`item ${onDoBackup ? "" : "disabled"}`}>
          <i className="icon play"/>
        </a>
      </div>
      <h3 className="ui header centered stretch white text">{text}</h3>
    </div>
  )
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
        <div className="ui grid with padding" style={{margin: 0}}>
          <div className="ten wide column">
            <h2 className="ui header">{backup.name}</h2>
            <MarkdownPreview value={backup.description}/>
            <div>{i18n("Completed on: ")}<b>{backup.completed_date}</b></div>
          </div>
          <div className="six wide column">
            {size.size ? (
              <div className="ui centered huge blue text" style={{paddingTop: 10}}>
                {size.size.toFixed(2)} <span className="ui big text">{size.unit}</span>
              </div>
            ) : (
              <div className="ui centered huge grey text" style={{paddingTop: 10}}>
                0.00 <span className="ui big text">B</span>
              </div>
            )}
          </div>
        </div>
        <div className="ui divider"/>
        <div className="ui extend with scroll and padding">
          <div>
            <h3 className="ui header" style={{margin:"10px 0 0 0"}}>{i18n("Source")}</h3>
            <div>{backup.source.component}</div>
          </div>
          <div>
            <h3 className="ui header" style={{margin:"10px 0 0 0"}}>{i18n("Destination")}</h3>
            <div>{backup.destination.component}</div>
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
