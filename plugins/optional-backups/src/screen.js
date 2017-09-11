const {rpc, i18n, React} = Serverboards
const plugin_id="serverboards.optional.backups"
import List from './containers/list'

function main(el, config){
  console.log(config)
  Serverboards.ReactDOM.render((
      <List
        setSectionMenu={config.setSectionMenu}
      />
    ), el)

  return function(){
    let ok = true
    while(ok){
      ok = Serverboards.ReactDOM.unmountComponentAtNode(el)
      console.log("Umount backups", ok)
    }
  }
}

Serverboards.add_screen(`${plugin_id}/screen`, main)
