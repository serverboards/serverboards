import React from 'react'
import i18n from 'app/utils/i18n'

class FutureLabel extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      data: i18n("...loading..."),
      className: props.className
    }
  }
  componentDidMount(){
    this.props.promise()
      .then( data => {
        this.setState({data})
      }).catch( e => {
        console.error(e)
        this.setState({data: i18n("Error loading data"), className: "ui error"})
      })
  }
  render(){
    return (
      <span className={this.state.className}>{this.state.data}</span>
    )
  }
}

export default FutureLabel
