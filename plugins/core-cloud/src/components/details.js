const {i18n, utils, React} = Serverboards

const UNITS = [ "B", "KiB", "MiB", "GiB", "TiB", "ZiB"]
const KiB = 1024 * 1024

export function calculate_size(size){
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
      <div className="ui bigger text">
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

function Details({vmc}){
  console.log(vmc)
  const data = {
    ip: (vmc.props.public_ips || []).join(' '),
    ip6: (vmc.props.public_ips6 || []).join(' '),
    dns: vmc.props.dns_name
  }
  const props = vmc.props

  let memory=calculate_size(props.memory_total * KiB)

  return (
    <div className="extend">
      <div className={`ui attached colored top ${utils.colorize(vmc.state)} background menu`}>
        <div className="ui menu">
          {vmc.state == "running" ? (
              <a className="item">
                <i className="icon stop"/>
              </a>
            ) : (
              <a className="item">
                <i className="icon play"/>
              </a>
          )}
        </div>
        <h3 className="ui header centered stretch white text">{i18n(vmc.state)}</h3>
      </div>
      <div className="ui padding">
        <h2 className="ui header">{vmc.name}</h2>
      </div>
      <div className="ui divider"></div>
      <div className="ui padding">
        <div className="ui three column grid">
          {memory && (
            <BigStat
              className="column"
              label={i18n("MEM TOTAL")}
              value={`${memory.size} ${memory.unit}`}
              percent={(props.memory_used || 0.0)/props.memory_total}
              description={i18n("{size} {unit} used", calculate_size( (props.memory_used || 0.0) * KiB ))}
              />
          )}
          <BigStat
            className="column"
            label={i18n("DISK TOTAL")}
            value={"3 TiB"}
            percent={1.4/3}
            description={i18n("1.4 TiB used")}
            />
          <BigStat
            className="column"
            label={i18n("CPU USAGE")}
            value={"68 %"}
            percent={0.68}
            />
        </div>
        {data.ip && (
          <div style={{paddingTop:30}}>
            <h4 className="ui header">{i18n("IP Address")}</h4>
            {data.ip}
          </div>
        )}
        {data.ip6 && (
          <div className="ui top padding">
            <h4 className="ui header">{i18n("IPv6 Address")}</h4>
            {data.ip6}
          </div>
        )}
        {data.dns && (
          <div className="ui top padding">
            <h4 className="ui header">{i18n("DNS")}</h4>
            {data.dns}
          </div>
        )}
      </div>
      <div className="ui divider"></div>
      <h3 className="ui teal with padding" style={{margin:0, paddingTop: 0}}>{i18n("Other Data")}</h3>
      <div className="ui extends with scroll">
        <ul className="ui no bullet list with padding">
          {Object.keys(vmc.props).sort().map( k => (
            <DL key={k} label={k} value={vmc.props[k]}/>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Details
