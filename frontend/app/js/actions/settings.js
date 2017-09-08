import rpc from 'app/rpc'
import Flash from 'app/flash'

export function settings_all(){
  return (dispatch) => {
    rpc.call("settings.list",[]).then(function(settings){
      dispatch({type:"SETTINGS_ALL", settings: settings})
    })
  }
}
