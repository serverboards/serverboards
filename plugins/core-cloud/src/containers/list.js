const {rpc, plugin, i18n, utils, React} = Serverboards
const {Loading, Error} = Serverboards.Components
import View from '../components/list'

function match_filter(item, words){
  let matches = true
  for (const w of words)
    matches &= match_filter_word(item, w)
  return matches
}

function match_filter_word(item, word){
  // console.log("Match? %o %o", item, word)
  if (!word)
    return true
  if (!item)
    return false
  if (item instanceof Object){
    for(const k of Object.keys(item)){
      if (match_filter_word(item[k], word))
        return true
    }
  }
  else if (String(item).toLowerCase().includes(word))
    return true
  return false
}

class List extends React.Component{
  constructor(props){
    super(props)
    this.state={
      loading: true,
      all_items: undefined,
      items: undefined,
      current: undefined,
      filter: undefined,
      by_provider: true
    }
  }
  componentDidMount(){
    plugin.start_call_stop("serverboards.core.cloud/daemon", "list", {project: this.props.project}).then( (items) => {
      const all_items = utils.sort_by_name(items)
      this.setState({items: this.filter(all_items, this.state.filter), all_items, loading: false})
    }).catch( e => this.setState({loading: "error", error: e}))
  }
  handleSetFilter(filter=""){
    if (this.state.filterTimeout)
      clearTimeout(this.state.filterTimeout)
    const filterTimeout = setTimeout( () => {
      filter = filter.split(/\s+/).filter( x => x ).map( s => s.toLowerCase() )
      this.setState({
        filter,
        items: this.filter(this.state.all_items, filter),
        filterTimeout: undefined
      })
    }, 400)
    this.setState({filterTimeout})
  }
  handleSetByProvider(by_provider){
    this.setState({by_provider})
    this.handleSetFilter((this.state.filter || []).join(' '))
  }
  filter(items, filter){
    let filtered=items
    if (filter)
      filtered = items
        .filter( i => match_filter(i, filter) )
    if (this.state.by_provider){
      let lastpro=undefined
      let current_pro=[]
      let ret = {}
      for (let i of filtered){
        if (lastpro!=i.parent){
          lastpro=i.parent
          current_pro=ret[lastpro] || []
          ret[lastpro]=current_pro
        }
        current_pro.push(i)
      }
      filtered = ret
    }
    return filtered
  }
  render(){
    if (this.state.loading == true){
      return (
        <Loading>{i18n("Cloud nodes")}</Loading>
      )
    }
    if (this.state.loading == "error"){
      return (
        <Error>{i18n("Could not load cloud nodes list. Try again. {e}", {e: this.state.error})}</Error>
      )
    }
    return (
      <View
        items={this.state.items}
        reloadAll={this.componentDidMount.bind(this)}
        current={this.state.current}
        setCurrent={(current) => this.setState({current})}
        setFilter={this.handleSetFilter.bind(this)}
        setByProvider={this.handleSetByProvider.bind(this)}
        by_provider={this.state.by_provider}
        />
    )
  }
}

export default List
