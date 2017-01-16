const {rpc, React} = Serverboards
let plugin_id="serverboards.optional.quickactions"
import ActionList from './model/list'

function View(props){
  return (
    <ActionList serverboard={props.serverboard.shortname} services={props.serverboard.services}/>
  )
}

function main(el, config){
  Serverboards.ReactDOM.render(<View {...config}/>, el)
  plugin_id = config.plugin

  console.log(config)
  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(el)
  }
}

Serverboards.add_screen(`${plugin_id}/editor`, main)
