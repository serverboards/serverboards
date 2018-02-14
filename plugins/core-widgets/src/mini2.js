import {get_data} from './utils'

const {React, rpc}=Serverboards

class Mini2 extends React.Component{
  componentDidMount(){
    const props = this.props
    props.setTitle(" ")
    this.updateData()
  }
  updateData(props){
    this.props.setClass( `${this.props.config.color || "grey"} card` )
  }
  componentWillReceiveProps(newprops){
    if (!Serverboards.utils.object_is_equal(newprops.config, this.props.config)){
      // console.log("New props: ", newprops)
      this.updateData(newprops)
    }
  }
  render(){
    const props = this.props
    const config = props.config

    return (
      <div className="ui content half padding split vertical area">
        <h3 className="ui white header text">{config.title}</h3>
        <div className="extend"/>
        <div className="ui huge text" style={{display: "flex", alignItems: "bottom", height: 35, lineHeight: 0}}>
          {get_data(config.text)}
        </div>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/mini2", Mini2, {react: true})
