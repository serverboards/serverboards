import React from 'react'
import ConsoleView from 'app/components/console'
import { connect } from 'react-redux'
import rpc from 'app/rpc'
import {parse} from 'shell-quote'


var parse_param = function(param){
  if (param.indexOf(':')){
    let [k,v] = param.split(':')
    return { [k]: v }
  }
  if (param.indexOf('=')){
    let [k,v] = param.split('=')
    return { [k]: v }
  }
  return param
}

var parse_params = function(params){
  params = params.map( parse_param )

  let is_dict = params.every( (v) => typeof(v) == 'object' )
  if (is_dict){
    params=Object.assign({}, ...params)
  }

  return params
}

var parse_line = function(line){
  let cmd = parse(line, {})

  let rpc= {method: cmd[0], params: parse_params(cmd.slice(1))}
  return rpc
}


let Console = connect(
  (state) => ({
    lines: state.console.lines,
    show: state.console.show
  }),
  (dispatch) => ({
    onSubmit: function(text){
      dispatch({type: "CONSOLE_CALL", text: text })
      let cmd=parse_line(text)
      rpc.call(cmd.method, cmd.params).then(function(result){
        dispatch({type: "CONSOLE_RESPONSE", result: result })
      }).catch(function(error){
        dispatch({type: "CONSOLE_ERROR", error: error })
      })
    },
    onShow(){
      dispatch({type: "CONSOLE_SHOW"})
    },
    onHide(){
      dispatch({type: "CONSOLE_HIDE"})
    }
  })
)(ConsoleView)

export default Console
