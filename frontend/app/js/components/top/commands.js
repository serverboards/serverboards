import React from 'react'
import Command from 'app/utils/command'
import store from 'app/utils/store'
import { merge } from 'app/utils'
import { push } from 'react-router-redux'

const skip_nodes={
  INPUT: true,
  TEXTAREA: true,
  BUTTON: true
}

const CommandSearch = React.createClass({
  getInitialState(){
    return {
      is_open: false,
    }
  },
  getContext(){
    const state = store.getState()
    return {
      path: state.routing.locationBeforeTransitions.pathname,
      state: state,
      goto: (path) => store.dispatch(push(path))
    }
  },
  componentDidMount(){
    let $search=$(this.refs.search)
    let self=this
    $(window).on('keyup', function(ev){
      if (ev.keyCode==27)
        self.handleToggleOpen()
      if (!self.state.is_open)
        return
      if (skip_nodes[ev.target.nodeName])
        return
      $search.find('input').focus()
    })
    $search.search({
      cache: false,
      apiSettings : {
        responseAsync(settings, callback){
          let Q = $search.search('get value').toLowerCase().split(" ")
          const context = self.getContext()

          function set_search_results(results){
            results = results.map( (r) => {
              const search_text =`${r.description} ${r.title}`.toLowerCase()
              return merge(r, {search_text})
            })
            //console.log(settings)
            for (let q of Q){ // refilter, search may not return filtered results
              results = results.filter( (r) => r.search_text.indexOf(q)>=0 )
            }
            results.sort( (a,b) => b.score - a.score )
            console.log(results.map( (r) => r.title ))

            callback({results, success: true})
          }
          Command.search(Q, context).then( set_search_results )
        }
      },
      onSelect(result, response){
        if (result.run)
          result.run()
        if (result.path){
          const state = store.getState()
          store.dispatch(push(result.path))
        }

        $search
          .search("set value", "")
          .search("hide results")
        return false
      }
    })
  },
  handleToggleOpen(set_open){
    if (set_open == undefined)
      set_open=!this.state.is_open
    if (set_open){
      setTimeout(() =>
        $(this.refs.search).find('input').focus().select()
        , 20
      )
    }
    this.setState({is_open: set_open})
  },
  render(){
    const is_open=this.state.is_open
    return (
      <div className="menu">
        <div ref="search" className={`ui search ${ is_open ? "" : "hidden"}`}>
          <div className="ui icon input">
            <input className="prompt" type="text" placeholder="Search and execute commands..."/>
            <i className="terminal icon" onClick={() => this.handleToggleOpen(false)}></i>
          </div>
          <div className="results">
          </div>
        </div>
        <a className={`item right aligned ${is_open ? "hidden" : ""}`} onClick={() => this.handleToggleOpen()}>
          <i className="ui icon terminal"/>
        </a>
      </div>
    )
  }
})

export default CommandSearch
