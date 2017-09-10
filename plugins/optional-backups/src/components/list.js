const {i18n, React, utils, Components} = Serverboards

const UNITS = [ "B", "KiB", "MiB", "GiB", "TiB", "ZiB"]

function calculate_size(size){
  let csize = size
  let i
  for (i=0;i<UNITS.length;i++){
    let nsize = csize/1024;
    if (nsize<1.0)
      break
    csize = nsize
  }

  return {
    size: csize,
    unit: UNITS[i]
  }
}

function Backup({backup, className}){
  const size = calculate_size(backup.size)

  return (
    <div className={`ui narrow card ${className || ""}`}>
      <div className="header">
        <i className="ui pink disk outline icon"/>
        <div className="ui right text label">
          {backup.status}
          <span className={`ui rectangular label ${utils.colorize(backup.status)}`}/>
        </div>
      </div>
      <div className="content">
        <h3 className="ui header" style={{marginBottom: 0}}>{backup.name}</h3>
        <div className="ui meta">{backup.description}</div>
        <div>
          <div>{i18n("Completed on:")}</div>
          <b>{backup.completed_date}</b>
        </div>
        <div className="ui centered huge blue text" style={{paddingTop: 10}}>
          {size.size.toFixed(2)} <span className="ui big text">{size.unit}</span>
        </div>
      </div>
      <div className="extra content">
        <div className="ui input checkbox toggle">
          <input type="checkbox" defaultChecked={backup.enabled}/>
          <label/>
        </div>
        <div className="right">
          <a>
            <i className="ui horizontal ellipsis teal icon"/>
          </a>
        </div>
      </div>
    </div>
  )
}

function List(props){
  const backups = [
    {
      id: 1,
      name: "Coronis content",
      description: "QNAP SSH",
      completed_date: "2017-10-09 19:02",
      size: 70000,
      enabled: true,
      status: "ok"
    },
    {
      id: 2,
      name: "Coronis content",
      description: "QNAP SSH",
      completed_date: "2017-10-09 19:02",
      size: 1234*1024*1024,
      enabled: false,
      status: "error"
    },
  ]
  let current = 1
  return (
    <div className="ui expand two column grid with grey background expand">
      <div className="ui column">
        <div className="ui white background round pane">
          <div className="ui attached top form">
            <div className="ui input seamless white">
              <i className="icon search"/>
              <input type="text" onChange={(ev) => this.setFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
            </div>
          </div>
          <div className="ui expand with scroll">
            <div className="ui cards with padding">
              {backups.map( b => (<Backup backup={b} className={current == b.id ? "selected" : null}/>))}
            </div>
          </div>
        </div>
      </div>
      <div className="ui column">
        <div className="ui white background round pane">
        </div>
      </div>
    </div>
  )
}

export default List
