import {get_data, MiniBar} from './utils'
const {React, i18n} = Serverboards
const {Loading} = Serverboards.Components
const {map_get} = Serverboards.utils

function prep_bars(bars){
  let ret = []
  if (!bars) {
    return []
  } else if (bars.length == 1){
    const bar = bars[0]
    console.log(bar)
    return [{
      name: bar[0],
      value: Number(bar[1])
    }]
  } else if (bars.length>3){
    ret = bars.map( b => ({name: b[0], value: Number(b[1])}) )
    console.log("Numbered", ret)
    function sum_others(bars){
      return bars.reduce((acc, b) => acc + b.value, 0)
    }
    ret = [
      ret[0], ret[1],
      {name: i18n("Others"), value: sum_others(ret.slice(2))}
    ]
  } else {
    ret = bars.map( b => ({name: b[0], value: Number(b[1])}) )
  }
  const total = ret.reduce( (acc, b) =>  acc + b.value, 0)
  // console.log("ret %o, total %o", ret, total)
  return ret.map( v => ({
    name: v.name,
    value: (v.value * 100.0) / total
  }))
}

class Mini3Bars extends React.Component{
  componentDidMount(){
    this.props.setTitle(' ')
  }
  shouldComponentUpdate(nextprops){
    return !Serverboards.utils.object_is_equal( nextprops.config, this.props.config )
  }
  render(){
    const props = this.props
    const config = props.config

    const rows = map_get(config, ["bars", "rows"])
    if (!rows){
      return (
        <Loading.Widget/>
      )
    }

    const bars = prep_bars(rows)
    const count = rows.length

    const split_style = {
      justifyContent: count == 1 ? "flex-end" : "space-evenly",
      alignSelf: count == 1 ? "flex-end" : "space-evenly",
      flex: 1,
      padding: "15px 5px"
    }

    return (
      <div className="ui extends" style={{display: "flex", width: "100%"}}>
        <div style={{display: "flex", flexDirection: "column", flex: 0, padding: 10, marginRight: 30}}>
          <h3 className="ui oneline header" style={{flex: 1}}>{config.title}</h3>
          <div className="ui big text" style={{fontSize: 36, letterSpacing: -2, paddingBottom: 15, whiteSpace: "nowrap"}}>
            {get_data(config.big_label)}
          </div>
        </div>
        <div className="ui vertical split area"
             style={split_style}>
          {bars.map( (b, i) => (
            <div key={b.name} style={{lineHeight: "15px"}}>
              {b.name}
              <div style={{display: "flex", alignItems: "center"}}>
                <div style={{flex: 1}}>
                  <MiniBar value={b.value}/>
                </div>
                <div style={{width: "4em", textAlign: "right", paddingRight: 10, paddingLeft: 5}}>
                  {b.value.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}


Serverboards.add_widget("serverboards.core.widgets/mini3bars", Mini3Bars, {react: true})
