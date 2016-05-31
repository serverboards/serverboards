import React from 'react'
import HoldButton from './holdbutton'

let MaxTable=React.createClass({
  getInitialState(){
    return {
      max: 3
    }
  },
  handleShowAll : function(){
    this.setState({max: this.props.data.length})
  },
  handleShowLess : function(){
    this.setState({max: 3})
  },
  render(){
    let props=this.props
    let max=this.state.max
    return (
      <div ref="el">
        <table className="ui table" style={{marginBottom: 0}}>
          <thead>
            <tr>
            {props.headers.map( (h) =>(
              <th key={h}>{h}</th>
            ))}
            {this.props.onDelete ? (
              <th/>
            ) : []}
            </tr>
          </thead>
          <tbody>
            {props.data.slice(0,max).map( (u) => (
              <tr key={u}>
                <td>
                  {u}
                </td>
                {this.props.onDelete ? (
                  <td className="right aligned">
                    <HoldButton className="ui trash icon" data-content="Hold to remove"
                     onHoldClick={() => this.props.onDelete(u)}/>
                    </td>
                  ) : []}
              </tr>
            ) ) }
          </tbody>
        </table>
        {(props.data.length > 3) ? (
          (props.data.length > max) ? (
            <a href="#!" onClick={(ev) => {ev.preventDefault();  this.handleShowAll()}}>
            And {props.data.length - max} more...
            </a>
          ) : (
            <a href="#!" className="ui top attached" onClick={(ev) => {ev.preventDefault(); this.handleShowLess()}}>
            Show less
            </a>
          ))
          : ""}
      </div>
    )
  }
})

export default MaxTable
