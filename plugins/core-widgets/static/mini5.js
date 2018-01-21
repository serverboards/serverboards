(function(){
  const {React, rpc}=Serverboards

  class Mini5 extends React.Component{
    constructor(props){
      super(props)
      this.state = {
        title: undefined, color: undefined,
        text_left: undefined, text_right: undefined,
        icon_left: undefined, icon_right: undefined,
        expr_left: undefined, expr_right: undefined
      }
    }
    componentDidMount(){
      const props = this.props
      props.setClass( `${props.config.color || "grey"} card` )
      props.setTitle(" ")

      rpc.call("dashboard.widget.extract", [props.uuid]).then( newstate => {
        let state = newstate[0]
        state.expr_left=state.expr_left.rows[0][0]
        state.expr_right=state.expr_right.rows[0][0]
        this.setState(state)
      })
    }
    render(){
      const props = this.props
      const config = this.state

      return React.createElement('div', {className: "ui content half padding"}, [
        React.createElement('h3',{className: "ui white header text"}, [config.title]),
        React.createElement('div',{className: "ui two column grid"}, [
          React.createElement('div', {className: "column"}, [
            React.createElement('div', {style:{ display: "flex", alignItems: "center", height: 25}}, [
              React.createElement('i', {className: `${config.icon_left} icon`}, []),
              React.createElement('span', {className: "ui biggier text"}, [ config.expr_left ])
            ]),
            React.createElement('div', {}, [
              config.text_left
            ])
          ]),
          React.createElement('div', {className: "column"}, [
            React.createElement('div', {style:{ display: "flex", alignItems: "center", height: 25}}, [
              React.createElement('i', {className: `${config.icon_right} icon`}, []),
              React.createElement('span', {className: "ui biggier text"}, [ config.expr_right ])
            ]),
            React.createElement('div', {}, [
              config.text_right
            ])
          ])
        ])
      ])
    }
  }

  Serverboards.add_widget("serverboards.core.widgets/mini5", Mini5, {react: true})
})()
