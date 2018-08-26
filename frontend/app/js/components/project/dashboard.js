import React from 'react'
import {random_color} from 'app/utils'
import Board from 'app/containers/board'
import Loading from '../loading'
import HeaderMenu from 'app/containers/board/header'
import {SectionMenu} from 'app/components'


class Overview extends React.Component{
  // componentDidMount(){
  //   this.props.setSectionMenu(HeaderMenu)
  // }
  render(){
    const props = this.props
    if (!props.project)
      return (
        <Loading>
          Serverboard data
        </Loading>
      )
    return (
      <div className="ui central" id="dashboard">
        <SectionMenu menu={HeaderMenu}/>

        <Board location={props.location} project={props.project.shortname} show_sidebar={props.show_sidebar}/>
      </div>
    )
  }
}


export default Overview
