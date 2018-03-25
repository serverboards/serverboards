import React from 'react'
import CodeMirror from 'react-codemirror'
import CM from 'codemirror'

require('codemirror/mode/sql/sql')
require('codemirror/mode/markdown/markdown')
require('codemirror/lib/codemirror.css')
require('codemirror/theme/solarized.css')

function set(str) {
  var obj = {}, words = str.split(" ");
  for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
  return obj;
}

// Custom SQL dialect.
CM.defineMIME("text/x-s10s", {
  name: "sql",
  client: set("source"),
  keywords: set(
    "select where from as inner cross left right outer join on" +
    "group by order asc desc true false not distinct limit offset" +
    "all null case if elif when then else end in like ilike"),
  builtin: {},
  atoms: set("false true null"),
  operatorChars: /^[*+\-%<>!=&|^\/#@?~]/,
  dateSQL: set("time"),
  support: set("decimallessFloat zerolessFloat binaryNumber hexNumber")
});

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
        mode: props.mode == "sql" ? "text/x-s10s" : props.mode,
      }}
      />
  )
}

export default CodeMirrorWrapper
