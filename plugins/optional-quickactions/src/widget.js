const {rpc, React, plugin, store} = Serverboards
let plugin_id="serverboards.optional.quickactions"
const {Loading} = Serverboards.Components

const style={
  a:{
    display: "block",
    padding: "10px 10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee"
  },
  span: {
    color: "#666"
    paddingLeft: "10px"
  },
  list: {
    padding: "0 10px"
  }
}


const Widget = React.createClass({
  getInitialState(){
    return {
      actions: undefined,
      loading: true
    }
  },
  componentDidMount(){
    plugin.start_call_stop(`serverboards.optional.quickactions/command`, "list_actions", {}).then( actions => {
      this.setState({actions, loading: false})
    })
  },
  runAction(a){
    if (a.confirmation){
      if (!confirm(a.name + "\n\n" + (a.description || a.confirm || "Are you sure?")))
        return;
    }
    plugin.start_call_stop(`serverboards.optional.quickactions/command`, "run_action", [a.id]).then( () => {
      Flash.info("Sucefully run action "+a.name)
    }).catch( e => Flash.error(e) )
  },
  render(){
    if (this.state.loading)
      return (
        <Loading>Quick Actions</Loading>
      )
    const actions = this.state.actions.filter( a => a.star )
    if (actions.length == 0){
      return (
        <div>
          There are no Quick Actions yet. Create and star some
          <a onClick={() => store.goto(`/serverboard/${this.props.serverboard}/serverboards.optional.quickactions/editor/`)}> here</a>
        </div>
      )
    }
    return (
      <div className="ui list" style={style.list}>
        {actions.map( a => (
          <a
            onClick={() => this.runAction(a)}
            style={style.a}
            >
            <i className={`ui icon ${a.icon || "play"}`}/>
            <span style={style.span}>{a.name}</span>
          </a>
        ))}
      </div>
    )
  }
})

function main(el, config){
  Serverboards.ReactDOM.render(<Widget {...config}/>, el)
  plugin_id = config.plugin

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(el)
  }
}

Serverboards.add_widget(`${plugin_id}/widget`, main)
