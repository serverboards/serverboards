import React from 'react'
import Widget from './widget'
import AddWidget from './add_widget'
import EditWidget from './edit_widget'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import BoardHeader from './header'

require('sass/board.sass')

const Board = React.createClass({
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

export default Board
