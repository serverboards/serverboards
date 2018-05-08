import {get_data} from './utils'
const {React, rpc, i18n} = Serverboards
const {Loading, Error} = Serverboards.Components
const {map_get} = Serverboards.utils

class Mini5 extends React.Component{
  componentDidMount(){
    const props = this.props
    props.setTitle(" ")
    // console.log("props", props)
    this.updateData(props)
  }
  updateData(props){
    props.setClass( `${props.config.color || "grey"} card` )
  }
  componentWillReceiveProps(newprops){
    if (!Serverboards.utils.object_is_equal(newprops.config, this.props.config)){
      // console.log("New props: ", newprops)
      this.updateData(newprops)
    }
  }
  shouldComponentUpdate(nextprops, nextstate){
    return !(Serverboards.utils.object_is_equal(this.props.config, nextprops.config))
  }
  render(){
    const props = this.props
    const config = props.config

    const data = map_get(config, ["data", "rows"])

    if (map_get(config, ["data", "error"])){
      return (
        <Error/>
      )
    }

    if (!data){
      return (
        <Loading.Widget/>
      )
    }


    return (
      <div className="ui content half padding split vertical area" style={{justifyContent: "space-around"}}>
        <h3 className="ui white header text">{config.title}</h3>
        <div className="ui horizontal split area">
          {data.map( datum => (
            <div key={datum} className="expand align bottom" style={{paddingRight: 2}}>
              <div style={{display: "flex", alignItems: "center"}}>
                <span className={`ui bigger oneline text`}>
                  {datum[1]}
                </span>
              </div>
              <div style={{paddingLeft: config.icon_left ? 20 : 0, opacity: 0.75}}>{datum[0]}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/minin", Mini5, {react: true})
