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

    return (
      <div className="ui content half padding split vertical area">
        <h3 className="ui white header text">{config.title}</h3>
        <div className="extend"/>
        <div className="ui two column grid">
          <div className="column">
            <div style={{display: "flex", alignItems: "center", height: 25}}>
              <i className={`${config.icon_left} icon`}/>
              <span className="ui biggier text">{get_data(config.expr_left)}</span>
            </div>
            <div>{config.text_left}</div>
          </div>
          <div className="column">
            <div style={{display: "flex", alignItems: "center", height: 25}}>
              <i className={`${config.icon_right} icon`}/>
              <span className="ui biggier text">{get_data(config.expr_right)}</span>
            </div>
            <div>{config.text_right}</div>
          </div>
        </div>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/mini5", Mini5, {react: true})
