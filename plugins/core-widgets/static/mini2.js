(function(){
  const React=Serverboards.React

  class Mini2 extends React.Component{
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
        React.createElement('div', {className: "ui huge text", style:{ display: "flex", alignItems: "bottom", height: 35}}, [
          config.text
        ])
      ])
    }
  }

  Serverboards.add_widget("serverboards.core.widgets/mini2", Mini2, {react: true})
})()
