const {rpc, i18n, React} = Serverboards
const plugin_id="serverboards.optional.backups"
import List from './containers/list'

function main(el, config){
  console.log(config)
  Serverboards.ReactDOM.render((
      <List
        project={config.project.shortname}
      />
    ), el)

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(el)
  }
}

Serverboards.add_screen(`${plugin_id}/screen`, main)
