(function(){
  const {React, rpc, i18n}=Serverboards

  class Mini5 extends React.Component{
    componentDidMount(){
      const props = this.props
      props.setTitle(" ")
      console.log("props", props)
      this.updateData(props)
    }
    updateData(props){
      props.setClass( `${props.config.color || "grey"} card` )
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
      if (expr.error){
        return React.createElement('span', {className: "ui error"}, [i18n("Invalid expression.")])
      }
      else if (expr.rows){
        return String(expr.rows[0])
      }
      return String(expr)
    }
    shouldComponentUpdate(nextprops, nextstate){
      return !(Serverboards.utils.object_is_equal(this.props.config, nextprops.config))
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
              React.createElement('span', {className: "ui biggier text"}, [ this.getData(config.expr_left) ])
            ]),
            React.createElement('div', {}, [
              config.text_left
            ])
          ]),
          React.createElement('div', {className: "column"}, [
            React.createElement('div', {style:{ display: "flex", alignItems: "center", height: 25}}, [
              React.createElement('i', {className: `${config.icon_right} icon`}, []),
              React.createElement('span', {className: "ui biggier text"}, [ this.getData(config.expr_right) ])
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
