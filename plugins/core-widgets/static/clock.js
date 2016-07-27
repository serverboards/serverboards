// This file uses vanilla JS ES5 as it is not compiled. It nontheless uses React

function main(element, config){
  const React=Serverboards.React

  const Clock=React.createClass({
    getInitialState: function(){
      return { time: this.time(), interval_id: undefined }
    },
    componentDidMount: function(){
      if (!this.state.interval_id){
        interval_id = setInterval(this.update_timer.bind(this), 1000)
        this.setState({interval_id: interval_id})
      }
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
        React.createElement('div', {className: ""}, [
          React.createElement('div', {className: "ui header"}, [ "Current time" ]),
          React.createElement('div', {className: "content", style: {"font-family":"fixed", "line-height": "75px", "font-size": "75px", "padding-top":"20px"}}, [
            React.createElement('span', {className: "hour"}, hour),
            ":",
            React.createElement('span', {className: "minute"}, minute),
            ":",
            React.createElement('span', {className: "second", style: {"font-size":"50px", "color":"#888"}}, second)
          ] )
        ] )
      )
    }
  })

  Serverboards.ReactDOM.render(React.createElement(Clock, null), element)

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(element)
  }
}

Serverboards.add_widget("serverboards.core.widgets/clock", main)
