(function(){
  const React=Serverboards.React

  class Mini5 extends React.Component{
    componentDidMount(){
      const props = this.props
      props.setClass( `${props.config.color || "grey"} card` )
      props.setTitle(" ")
    }
    render(){
      const props = this.props
      const config = props.config

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
