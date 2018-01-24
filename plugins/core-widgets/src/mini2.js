(function(){
  const {React, rpc}=Serverboards

  class Mini2 extends React.Component{
    constructor(props){
      super(props)

      this.state = {
        color: props.config.color,
        title: props.config.title,
        text: undefined
      }
    }
    componentDidMount(){
      const props = this.props
      props.setTitle(" ")

      this.updateData(this.props)
    }
    updateData(props){
      rpc.call("dashboard.widget.extract", [props.uuid]).then( state => {
        state = state[0]
        console.log(state)
        props.setClass( `${state.color || "grey"} card` )
        state.text = state.text.rows[0][0]

        this.setState(state)
      })
    }
    componentWillReceiveProps(newprops){
      if (!Serverboards.utils.object_is_equal(newprops.config, this.props.config)){
        console.log("New props: ", newprops)
        this.updateData(newprops)
      }
    }
    render(){
      const props = this.props
      const config = this.state

      return (
        <div className="ui content half padding">
          <h3 className="ui white header text">{config.title}</h3>
          <div className="ui huge text" style={{display: "flex", alignItems: "bottom", height: 35}}>
            {config.text}
          </div>
        </div>
      )
    }
  }

  Serverboards.add_widget("serverboards.core.widgets/mini2", Mini2, {react: true})
})()
