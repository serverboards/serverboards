const {rpc, React} = Serverboards
const plugin_id="serverboards.optional.backups"
import List from './components/list'

function main(el, config){
  Serverboards.ReactDOM.render((
      <List/>
    ), el)

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(el)
  }
}

Serverboards.add_screen(`${plugin_id}/screen`, main)
