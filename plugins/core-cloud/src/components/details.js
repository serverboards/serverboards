const {i18n, utils, store, React} = Serverboards

const UNITS = [ "B", "KiB", "MiB", "GiB", "TiB", "ZiB"]
const MiB = 1024 * 1024

export function calculate_size(size){
  if (!size)
    return null
  let csize = size
  let i
  for (i=0;i<UNITS.length;i++){
    let nsize = csize/1024;
    if (nsize<1.0)
      break
    csize = nsize
  }

  return {
    size: csize.toFixed(2),
    unit: UNITS[i]
  }
}

class DL extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      open: this.props.open
    }
  }
  render(){
    const {open} = this.state
    const {label, value} = this.props
    const simple = !(value instanceof Object)

    if (simple)
      return (
        <li onClick={() => this.setState({open: true})}>
          <label className="ui bold text" style={{paddingLeft: 20}}>{label}:</label>
          <span style={{paddingLeft: 10}}>{value}</span>
        </li>
      )

    if (!open)
      return (
        <li onClick={() => this.setState({open: true})}>
          <i className="icon caret right"/>
          <label className="ui bold text">{label}</label>
        </li>
      )

    return (
      <li>
        <label className="ui bold text" onClick={() => this.setState({open: false})}>
          <i className="icon caret down"/>
          {label}
        </label>
        <ul>
          {Object.keys(value).sort().map( k => (
            <li key={k}>
              <DL label={k} value={value[k]}/>
            </li>
          ))}
        </ul>
      </li>
    )
  }
}

function BigStat({label, value, percent, description, className, show_percentage}){
  return (
    <div className={`ui centered text ${className || ""}`}>
      <div>{label}</div>
      <div className="ui bigger text oneline">
        {value}
      </div>
      {percent ? (
        <div className="ui teal progress" data-percent={percent*100}>
          <div className="ui bar" style={{width:`${Math.min(percent*100, 100)}%`}}/>
          {description && (
            <div className="label">{description}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Details({vmc, template, parent, onStart, onStop}){
  const props = vmc.props || {}
  const data = {
    ip: utils.merge(props.public_ips || [], props.private_ips || []),
    ip6: utils.merge(props.public_ips6 || [], props.private_ips6 || []),
    dns: props.dns_name
  }

  let memory=calculate_size(props.mem_total * MiB)
  let disk=calculate_size(props.disk_total * MiB)

  return (
    <div className="extend">
      <div className={`ui attached colored top ${utils.colorize(vmc.state)} background menu`}>
        <div className="ui menu">
          {vmc.state == "running" ? (
              <a onClick={onStop} className="item">
                <i className="icon stop"/>
              </a>
            ) : (
              <a onClick={onStart} className="item">
                <i className="icon play"/>
              </a>
          )}
        </div>
        <h3 className="ui header centered stretch white text">{i18n(vmc.state)}</h3>
      </div>
      <div className="ui padding">
        <h2 className="ui header" style={{marginBottom:0}}>{vmc.name}</h2>
        <div>
          {template && template.name}
        </div>
        <div>
          {parent && (
            <a onClick={() => store.goto(`/services/${parent.uuid}/`)}>{parent.name}</a>
          )}
        </div>
      </div>
      <div className="ui divider"></div>
      <div className="ui padding">
        { (memory || disk || props.CPU_rt!= undefined) &&
          <div className="ui three column grid" style={{paddingBottom:30}}>
            {memory && (
              <BigStat
                className="column"
                label={i18n("MEM TOTAL")}
                value={`${memory.size} ${memory.unit}`}
                percent={props.mem_free_rt && (props.mem_total-props.mem_free_rt)/props.mem_total}
                description={i18n("{size} {unit} free", calculate_size( (props.mem_free_rt || 0.0) * MiB ))}
                />
            )}
            {disk && (
              <BigStat
                className="column"
                label={i18n("DISK TOTAL")}
                value={`${disk.size} ${disk.unit}`}
                percent={props.disk_free_rt && (props.disk_total-props.disk_free_rt)/props.disk_total}
                description={i18n("{size} {unit} free", calculate_size( (props.disk_free_rt || 0.0) * MiB ))}
                />
            )}
            {(props.CPU_rt != undefined) && (
              <BigStat
                className="column"
                label={i18n("CPU USAGE")}
                value={`${(props.CPU_rt*100.0).toFixed(1)} %`}
                percent={props.CPU_rt}
                />
            )}
          </div>
        }
        {data.ip && data.ip.length!=0 && (
          <div>
            <h4 className="ui header">{i18n("IP Address")}</h4>
            {data.ip.map( ip => (
              <div>{ip}</div>
            ))}
          </div>
        )}
        {data.ip6 && data.ip6.length!=0 && (
          <div className="ui top padding">
            <h4 className="ui header">{i18n("IPv6 Address")}</h4>
            {data.ip6.map( ip => (
              <div>{ip}</div>
            ))}
          </div>
        )}
        {data.dns && data.dns.length!=0 && (
          <div className="ui top padding">
            <h4 className="ui header">{i18n("DNS")}</h4>
            {data.dns.map( dns  => (
              <div>{dns}</div>
            ))}
          </div>
        )}
      </div>
      <div className="ui divider"></div>
      <h3 className="ui teal with padding" style={{margin:0, paddingTop: 0}}>{i18n("Other Data")}</h3>
      <div className="ui extends with scroll">
        <ul className="ui no bullet list with padding">
          {Object.keys(props).sort().map( k => (
            <DL key={k} label={k} value={props[k]}/>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Details
