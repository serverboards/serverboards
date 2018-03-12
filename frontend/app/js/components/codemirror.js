import React from 'react'
import CodeMirror from 'react-codemirror'

require('codemirror/mode/sql/sql')
require('codemirror/mode/markdown/markdown')
require('codemirror/lib/codemirror.css')
require('codemirror/theme/solarized.css')


function CodeMirrorWrapper(props){
  return (
    <CodeMirror
      {...props}
      options={{
        theme:"solarized dark",
        extraKeys: {
          "Ctrl-Enter": props.onCtrlEnter,
          "Ctrl-Space": "autocomplete"
        },
        hintOptions: props.hintOptions,
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets : true,
        mode: props.mode,
      }}
      />
  )
}

export default CodeMirrorWrapper
