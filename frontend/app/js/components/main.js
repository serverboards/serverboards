import React from 'react';

import Empty from './empty'
import Top from '../containers/top'

var Sidebar = Empty
var Central = Empty

export default function Main(props){
  return(
    <div>
      <Top onLogout={() => this.handle_login(false).bind(this)}/>
      <Sidebar/>
      <Central/>
    </div>
  )
}
