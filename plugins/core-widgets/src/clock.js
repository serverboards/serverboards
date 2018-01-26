// This file uses vanilla JS ES5 as it is not compiled. It nontheless uses React

(function(){
  const React=Serverboards.React

  const styles = {
    clock: {
      fontFamily:"fixed",
      lineHeight: "75px",
      fontSize: "65px",
      paddingTop:"0px",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      padding: 0
     }
  }

  const Clock=React.createClass({
    getInitialState: function(){
      return { time: this.time(), interval_id: undefined }
    },
    componentDidMount: function(){
      if (!this.state.interval_id){
        const interval_id = setInterval(this.update_timer, 1000)
        this.setState({interval_id: interval_id})
      }
      this.props.setClass("orange card")
    },
    componentWillUnmount: function(){
      if (this.state.interval_id){
        clearInterval(this.state.interval_id)
        this.setState({interval_id: undefined})
      }
    },
    time: function(){
      var currentDate=new Date()
      function lpad(n){
        return ("0"+n).slice(-2)
      }
      return {
        hour: lpad(currentDate.getHours()),
        minute: lpad(currentDate.getMinutes()),
        second: lpad(currentDate.getSeconds())
      }
    },
    update_timer: function(){
      this.setState({ time: this.time() })
    },
    render: function(){
      var time=this.state.time
      var hour=time.hour
      var minute=time.minute
      var second=time.second
      return (
        <div className="content">
          <div className="content" style={styles.clock}>
            <span className="hour">{hour}</span> :
            <span className="minute">{minute}</span> :
            <span className="second">{second}</span>
          </div>
        </div>
      )
    }
  })

  Serverboards.add_widget("serverboards.core.widgets/clock", Clock, {react: true})
})()
