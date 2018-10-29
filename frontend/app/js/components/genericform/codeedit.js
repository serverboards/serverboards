import React from 'react'
import AceEditor from 'react-ace'
import 'brace/ext/language_tools'
import 'brace/mode/sql'
import 'brace/theme/monokai'



function CodeEdit(props){
  return (
    <AceEditor
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

export default CodeEdit
