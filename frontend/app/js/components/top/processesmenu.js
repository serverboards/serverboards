import React from 'react'
import {Link} from 'app/router'
import {is_empty} from 'app/utils'
import {i18n} from 'app/utils/i18n'

class ProcessLine extends React.Component{
  componentDidMount(){
    $(this.refs.progress).progress()
  }
  componentWillReceiveProps(newprops){
    if (newprops.progress != this.props.progress){
      if (!this.props.progress)
        this.componentDidMount()
      $(this.refs.progress).progress("set progress", newprops.progress)
    }
  }
  render(){
    const p = this.props
    return (
      <a href={`#/process/${p.uuid}`} className="item divider">
        <div>
          <b>{p.name}</b>
          <i className="ui icon tiny right teal loading notched circle"/>
        </div>
        {p.progress ? (
          <div ref="progress" className="ui teal progress active" data-value={p.progress} data-total="100">
            <div className="bar">
              <div className="progress"></div>
            </div>
          </div>
        ) : null }
        { p.label ? (
            <div className="ui meta">{p.label}</div>
        ) : null }
      </a>
    )
  }
}

function ProcessesMenu(props){
  return (
    <div className="menu transition visible">
      {!is_empty(props.running) ? (
        <div>
          {props.running.map((p) =>
            <ProcessLine key={p.uuid} {...p}/>
          )}
        </div>
      ) : (
        <div>
          <div className="item centered ui grey" style={{display: "flex"}}>
            <span style={{flexGrow:1}}>{i18n("No active processes")}</span>
          </div>
        </div>
      )}
      <a href="#/process/history" className="item inverted yellow">
        {i18n("View process history")}
        <i className="ui caret right icon" style={{paddingLeft: 5}}/>
      </a>
    </div>
  )
}

export default ProcessesMenu
