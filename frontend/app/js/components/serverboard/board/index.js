import React from 'react'
import Widget from 'app/containers/serverboard/board/widget'
import AddWidget from 'app/containers/serverboard/board/add_widget'
import EditWidget from 'app/containers/serverboard/board/edit_widget'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import BoardHeader from './header'
import ReactGridLayout from 'react-grid-layout'

require('sass/board.sass')
require('sass/gridlayout.sass')

const Boardx = React.createClass({
  handleEdit(uuid){
    this.setModal("edit", {uuid})
  },
  setModal(modal, data){
    let state = {modal}
    if (data)
      state.data=data
    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: state
    } )
  },
  closeModal(){
    this.setModal(false)
  },
  contextTypes: {
    router: React.PropTypes.object,
  },
  componentDidMount(){
    let self=this
    Command.add_command_search('add-widget',(Q, context) => [
      {id: 'add-widget', title: 'Add Widget', description: 'Add a widget to this board', run: () => self.setModal('add') }
    ], 2)
  },
  componentWillUnmount(){
    Command.remove_command_search('add-widget')
  },
  render(){
    const widgets=this.props.widgets
    if (widgets == undefined){
      return (
        <Loading>Serverboard widget data</Loading>
      )
    }

    let modal = []
    switch(this.props.location.state && this.props.location.state.modal){
      case 'add':
        modal=(
          <AddWidget onClose={this.closeModal} serverboard={this.props.serverboard}/>
        )
        break;
      case 'edit':
        const uuid=this.props.location.state.data.uuid
        const widget=widgets.find( (w) => w.uuid == uuid )
        modal=(
          <EditWidget onClose={this.closeModal} serverboard={this.props.serverboard} widget={widget}/>
        )
        break;
    }


    return (
      <div className="ui board">
        <BoardHeader/>
        <div className="ui cards">

          {widgets.map( (w) => (
            <Widget
              key={w.uuid}
              widget={w.widget}
              config={w.config}
              uuid={w.uuid}
              onEdit={() => this.handleEdit(w.uuid)}
              serverboard={this.props.serverboard}
              />
          ))}
          <a onClick={(ev) => {ev.preventDefault(); this.setModal("add")}} className="ui massive button _add icon floating orange">
            <i className="add icon"></i>
          </a>
          {modal}
        </div>
      </div>
    )
  }
})

const Board = React.createClass({
  render: function() {
    const widgets=this.props.widgets
    if (widgets == undefined){
      return (
        <Loading>Serverboard widget data</Loading>
      )
    }
    // layout is an array of objects, see the demo for more complete usage
    var layout = [
      {i: 'a', x: 0, y: 0, w: 1, h: 2, static: true},
      {i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4},
      {i: 'c', x: 4, y: 0, w: 1, h: 2}
    ];
    return (
      <div className="ui board">
        <BoardHeader/>
        <ReactGridLayout
          className="ui cards layout"
          cols={4}
          rowHeight={280}
          width={1200}
          margin={[15,15]}
          draggableHandle=".ui.top.mini.menu .ui.header">
            {widgets.map( (w) => (
              <div key={w.uuid} className="ui card">
                <Widget
                  key={w.uuid}
                  widget={w.widget}
                  config={w.config}
                  uuid={w.uuid}
                  onEdit={() => this.handleEdit(w.uuid)}
                  serverboard={this.props.serverboard}
                  />
              </div>
            ))}
        </ReactGridLayout>
      </div>
    )
  }
});

export default Board
