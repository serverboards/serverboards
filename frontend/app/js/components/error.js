import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'
import i18n from 'app/utils/i18n'

function dotnot(col){
  if (typeof(col) == 'string')
    return col
  return col.join('.')
}

export function Error(props){
  return (
    <div className="ui centered fill error padding">
      <div>
        <i className="ui huge warning sign red icon"></i>
      </div>
      <FormatError error={props.children}/>
    </div>
  )
}

export class ErrorBoundary extends React.Component{
  constructor(props){
    super(props)
    this.state = {error: false}
  }
  componentDidCatch(error, info) {
    console.log("Render error: ", error, info)
    this.setState({ error });
  }
  render(){
    if (this.state.error){
      return (
        <Error>{this.props.error || String(this.state.error)}</Error>
      )
    }
    return this.props.children
  }
}

export function FormatError({error}){
  if (typeof(error) == 'string')
    return (
      <div className="ui text bold red">
        {error}
      </div>
    )

  switch(error[0]){
    case "not_found":
      return (
        <div className="ui text red">
          <span className="ui text bold">{dotnot(error[1])}</span>
          {(error.length == 4) ? (
            <React.Fragment>
              &nbsp;{i18n("not found in")}&nbsp;
              <ul>
                {error[3].map( col => (
                  <li key={col}>{dotnot(col)}</li>
                ))}
              </ul>
            </React.Fragment>
          ) : (
            " " + i18n("not found")
          )}
        </div>
      )
      break;
    case "syntax":
      return (
          <MarkdownPreview className="ui text red" value=
            {i18n("Syntax error at **line {line}**: **{error}**", {line: error[1][1], error: error[1][0]})}
          />
        )
      break;
    case "extractor":
      return (
          <MarkdownPreview className="ui text red" value=
            {i18n("Error extracting data from **{db}.{table}**: **{error}**", {db: error[1][0], table: error[1][1], error: error[2]})}
          />
        )
      break;
  }

  if (error && error.$$typeof){
    return (
      <div className="ui red left text">
        {error}
      </div>
    )
  }

  console.log("Original SQL error: ", error)
  return (
    <pre className="ui text red bold" style={{overflow: "unset"}}>{JSON.stringify(error,undefined,2)}</pre>
  )
}

export default Error
