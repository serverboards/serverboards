import rpc from '../rpc'
import Flash from '../flash'

export function settings_all(){
  return (dispatch) => {
    rpc.call("settings.all",[]).then(function(settings){
      dispatch({type:"SETTINGS_ALL", settings: settings})
    })
  }
}
