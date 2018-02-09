import {get_data} from './utils'
const {React, i18n} = Serverboards
const {Loading} = Serverboards.Components
const {map_get} = Serverboards.utils

function prep_bars(bars){
  let ret = []
  if (!bars) {
    return []
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
  console.log("ret %o, total %o", ret, total)
  return ret.map( v => ({
    name: v.name,
    value: (v.value * 100.0) / total
  }))
}

class MiniBar extends React.Component{
  componentDidMount(){
    $(this.refs.bar).progress({value: this.props.value})
  }
  componentWillReceiveProps(newprops){
    if (newprops.value != this.props.value)
      $(this.refs.bar).progress({value: newprops.value})
  }
  render(){
    return (
      <div className="ui blue tiny progress" ref="bar" style={{margin:0}}>
        <div className="bar"/>
      </div>
    )
  }
}

class Mini3Bars extends React.Component{
  shouldComponentUpdate(nextprops){
    return !Serverboards.utils.object_is_equal( nextprops.config, this.props.config )
  }
  render(){
    const props = this.props
    const config = props.config

    const rows = map_get(config, ["bars", "rows"])
    if (!rows)
      return (
        <Loading/>
      )

    const bars = prep_bars(rows)
    console.log(bars)

    return (
      <div className="ui extends" style={{display: "flex", width: "100%"}}>
        <div style={{display: "flex", flexDirection: "column", flex: 10, padding: 10}}>
          <h3 className="ui header" style={{flex: 1}}>{config.title}</h3>
          <div className="ui big bold text" style={{fontSize: 40, letterSpacing: -2, paddingBottom: 15}}>
            {get_data(config.big_label)}
          </div>
        </div>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "space-evenly", flex: 8}}>
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
