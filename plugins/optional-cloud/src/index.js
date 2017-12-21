const {rpc, React, i18n} = Serverboards
const plugin_id="serverboards.optional.cloud"
const component_id="node_list"
import List from './containers/list'
// import View from './components/list'


function main(el, config){
  Serverboards.ReactDOM.render((
      <List project={config.project.shortname}/>
    ), el)

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(el)
  }
}

Serverboards.add_screen(`${plugin_id}/${component_id}`, main)
