import React from 'react'
import AceEditor from 'react-ace'
import 'brace/ext/language_tools'
import 'brace/mode/sql'
import 'brace/theme/monokai'



class CodeEdit extends React.Component{
  componentDidMount(){
    if (this.props.onCtrlEnter){
      this.refs.ace.editor.commands.addCommand({
        name: "Execute",
        bindKey: "Ctrl-Enter",
        exec: this.props.onCtrlEnter
      })
    }
  }
  render(){
    const props = this.props
    return (
      <AceEditor
        ref="ace"
        mode="sql"
        theme="monokai"
        fontSize={16}
        width="100%"
        height="10em"
        style={{borderRadius: 3}}
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={true}
        {...props}
        />
      )
  }
}

export default CodeEdit
