const React=Serverboards.React
const {Loading} = Serverboards.Components

const styles = {
  clock: {
    fontFamily: "lato",
    lineHeight: "75px",
    paddingTop:"0px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0
   }
}

class Clock extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      time: this.time(),
      interval_id: undefined
    }
  }
  componentDidMount(){
    if (!this.state.interval_id){
      const interval_id = setInterval(this.update_timer.bind(this), 1000)
      this.setState({interval_id: interval_id})
    }
    this.props.setClass("orange card")
    props.setTitle("|fullsize")
  }
  componentWillUnmount(){
    if (this.state.interval_id){
      clearInterval(this.state.interval_id)
      this.setState({interval_id: undefined})
    }
  }
  time(){
    var currentDate=new Date()
    function lpad(n){
      return ("0"+n).slice(-2)
    }
    return {
      hour: lpad(currentDate.getHours()),
      minute: lpad(currentDate.getMinutes()),
      second: lpad(currentDate.getSeconds())
    }
  }
  update_timer(){
    this.setState({ time: this.time() })
  }
  render(){
    const layout = this.props.layout
    var time=this.state.time
    var hour=time.hour
    var minute=time.minute
    var second=time.second

    const fontSize = Math.min(layout.height/2, layout.width/5)

    return (
      <div className="content">
        <div className="content" style={{...styles.clock, height: layout.height, fontSize}}>
          <span className="hour">{hour}</span> :
          <span className="minute">{minute}</span> :
          <span className="second">{second}</span>
        </div>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/clock", Clock, {react: true})
