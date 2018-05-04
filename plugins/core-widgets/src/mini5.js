import {get_data} from './utils'
const {React, rpc, i18n}=Serverboards

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

    const nL = get_data(config.expr_left)
    const nR = get_data(config.expr_right)
    const nrsize = "bigger"

    return (
      <div className="ui content half padding split vertical area" style={{justifyContent: "space-around"}}>
        <h3 className="ui white header text">{config.title}</h3>
        <div className="ui horizontal split area">
          <div className="expand align bottom" style={{paddingRight: 2}}>
            <div style={{display: "flex", alignItems: "center"}}>
              {config.icon_left && <i className={`${config.icon_left} icon`}/>}
              <span className={`ui ${nrsize} oneline text`}>
                {nL}
              </span>
            </div>
            <div style={{paddingLeft: config.icon_left ? 20 : 0, opacity: 0.75}}>{config.text_left}</div>
          </div>
          <div className="expand align bottom" style={{paddingLeft: 2}}>
            <div style={{display: "flex", alignItems: "center"}}>
              {config.icon_right && <i className={`${config.icon_right} icon`}/>}
              <span className={`ui ${nrsize} oneline text`}>
                {nR}
              </span>
            </div>
            <div style={{paddingLeft: config.icon_right ? 20 : 0, opacity: 0.75}}>{config.text_right}</div>
          </div>
        </div>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/mini5", Mini5, {react: true})
