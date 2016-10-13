import React from 'react'
import Widget from 'app/containers/serverboard/board/widget'
import AddWidget from 'app/containers/serverboard/board/add_widget'
import EditWidget from 'app/containers/serverboard/board/edit_widget'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import BoardHeader from './header'
import ReactGridLayout from 'react-grid-layout'
import {object_is_equal} from 'app/utils'
import rpc from 'app/rpc'

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
  getLayout(props){
    const layout = this.props.widgets && this.props.widgets.map( (w) => w.ui ).filter( Boolean )
    return layout
  },
  getInitialState(){
    return {
      layout: this.getLayout(this.props)
    }
  },
  handleLayoutChange(layout){
    const to_set=layout.map( (l) => {
      const prev = (this.state.layout || []).find( (w) => w.i == l.i ) || {}
      if (object_is_equal(prev,l))
        return false
      return l
    }).filter( Boolean )
    to_set.map( (w) => {
      rpc.call("serverboard.widget.update", {uuid: w.i, ui: w})
    })
    this.setState({layout})
  },
  componentWillReceiveProps(newprops){
    if (!object_is_equal){
      const layout = this.getLayout(newprops)
      this.setState({ layout })
    }
  },
  render() {
    const widgets=this.props.widgets
    if (widgets == undefined){
      return (
        <Loading>Serverboard widget data</Loading>
      )
    }
    //const layout = this.state.layout || widgets.map( (w) => w.ui )
    //console.log(layout)
    return (
      <div className="ui board">
        <BoardHeader/>
        <ReactGridLayout
          className="ui cards layout"
          cols={4}
          rowHeight={280}
          width={1200}
          margin={[15,15]}
          draggableHandle=".ui.top.mini.menu .ui.header"
          layout={this.state.layout}
          onLayoutChange={this.handleLayoutChange}
          >
            {widgets.map( (w) => (
              <div
                key={w.uuid}
                data-grid={w.ui}
                className="ui card"
                >
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
