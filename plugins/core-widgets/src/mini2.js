(function(){
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
    getData(expr){
      if (!expr)
        return ""
      if (expr.loading){
        return (
          <i className="ui loading spinner icon"/>
        )
      }
      if (expr.error){
        return (
          <span className="ui centered expand" title={String(expr.error)}>
            <i className="icon warning sign" style={{color: "yellow"}}/>
          </span>
        )
      }
      else if (expr.rows){
        return String(expr.rows[0])
      }
      return String(expr)
    }
    render(){
      const props = this.props
      const config = props.config

      return (
        <div className="ui content half padding split vertical area">
          <h3 className="ui white header text">{config.title}</h3>
          <div className="extend"/>
          <div className="ui huge text" style={{display: "flex", alignItems: "bottom", height: 35, lineHeight: 0}}>
            {this.getData(config.text)}
          </div>
        </div>
      )
    }
  }

  Serverboards.add_widget("serverboards.core.widgets/mini2", Mini2, {react: true})
})()
