const {rpc, plugin, i18n, Flash, React} = Serverboards
const {Loading} = Serverboards.Components
import View from '../components/card'

class Model extends React.Component{
  call_and_reload(calln){
    const node = this.props.item
    return plugin.start_call_stop("serverboards.optional.cloud/daemon", calln, [node.parent, node.id])
      .then( () => this.props.reloadAll() )
      .catch( error => Flash.error(i18n("Could not perform action. Check logs.\n{error}", {error})))
  }
  onStart(){
    this.call_and_reload("start").then( () => {
      Flash.success(i18n("Started *{name}*", {name: this.props.item.name}))
    })
  }
  onPause(){
    this.call_and_reload("pause").then( () => {
      Flash.success(i18n("Paused *{name}*", {name: this.props.item.name}))
    })
  }
  onStop(){
    this.call_and_reload("stop").then( () => {
      Flash.success(i18n("Stopped *{name}*", {name: this.props.item.name}))
    })
  }
  render(){
    return (
      <View {...this.props}
        onStart={this.onStart.bind(this)}
        onPause={this.onPause.bind(this)}
        onStop={this.onStop.bind(this)}
      />
    )
  }
}


export default Model
