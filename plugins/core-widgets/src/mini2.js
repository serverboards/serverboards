import {get_data} from './utils'

const {React, rpc}=Serverboards

class Mini2 extends React.Component{
  componentDidMount(){
    const props = this.props
    props.setTitle("|fullsize")
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

    function DivOrA(props){
      if (props.href)
        return (
          <a {...props}>{props.children}</a>
        )
      return (
        <div {...props}>{props.children}</div>
      )
    }

    return (
      <DivOrA className="ui content half padding split vertical area"
           href={config.url} target="_blank" rel="noopener">
        <h3 className="ui white header text">{config.title}</h3>
        <div className="expand align bottom">
          <div className="ui huge white text" style={{fontSize: 36}}>
            {get_data(config.text)}
          </div>
        </div>
      </DivOrA>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/mini2", Mini2, {react: true})
