import React from 'react'
import ConsoleView from '../components/console'
import { connect } from 'react-redux'
import rpc from '../rpc'
import {parse} from 'shell-quote'


var parse_line = function(line){
  let cmd = parse(line, {})

  return {method: cmd[0], params: cmd.slice(1)}
}


let Console = connect(
  (state) => ({
    lines: state.console.lines
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
    }
  })
)(ConsoleView)

export default Console
