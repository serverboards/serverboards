import React from 'react'
import { unwrap } from 'app/utils'
import Loading from 'app/components/loading'

class AsyncPromises extends React.createClass{
  constructor(props){
    super(props)
    this.state = { loading: ["mounting"] }
  }
  componentDidMount(){
    const promises = unwrap(this.props.promises, this.props)

    let ret = { loading: [] }

    let maybe_now={ // If any promise is resolved now, it will be at updated properly
      setState(update){
        for(let k in update){
          ret[k]=update[k]
        }
      },
      getLoading: () => ret.loading
    }

    for(let p in promises){
      ret[p]=undefined
      ret.loading.push(p)

      promises[p].then( (v) => {
        let update={}
        update[p]=v
        update.loading = maybe_now.getLoading().filter( (l) => l!=p )
        console.log("Resolved promise %o", p)

        maybe_now.setState(update)
      })
    }
    maybe_now.setState=(upd) => this.setState(upd)
    maybe_now.getLoading=() => this.state.loading

    this.setState(ret)
  }
  render(){
    if (this.state.loading.length>0)
      return <Loading>{this.state.loading.join(', ')}</Loading>
    const View = this.props.component
    return <View {...this.props} {...this.state} promises={undefined} component={undefined} />
  }
}

export default AsyncPromises
