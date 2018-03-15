import React from 'react'
import Command from 'app/utils/command'
import store from 'app/utils/store'
import { merge } from 'app/utils'
import { push } from 'react-router-redux'
import {i18n, i18n_c, i18n_nop} from 'app/utils/i18n'

const skip_nodes={
  INPUT: true,
  TEXTAREA: true,
  BUTTON: true
}

class CommandSearch extends React.Component{
  constructor(props){
    super(props)
    this.state = {
    }
  }
  getContext(){
    const state = store.getState()
    return {
      path: state.routing.locationBeforeTransitions.pathname,
      state: state,
      goto: (path) => store.dispatch(push(path))
    }
  }
  componentDidMount(){
    let $search=$(this.refs.search)
    let self=this
    $(window).on('keyup', function(ev){
      if (ev.keyCode==27)
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
  }
  render(){
    return (
      <div ref="search" className={`ui search item`}>
        <div className="ui icon input">
          <input className="prompt" type="text" placeholder={i18n("Search and execute commands...")}/>
          <i className="search icon"/>
        </div>
        <div className="results">
        </div>
      </div>
    )
  }
}

export default CommandSearch
