import React from 'react'

export function Error(props){
  return (
    <div className="ui centered fill error padding">
      <div>
        <i className="ui huge warning sign red icon"></i>
      </div>
      <div className="ui text red bold">{props.children}</div>
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


export default Error
