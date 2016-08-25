import { connect } from 'react-redux'
import rpc from 'app/rpc'
import ConnectionBannerView from 'app/components/connectionbanner'

const ConnectionBanner=connect(
  (state) => ({
    status: state.rpc.status,
    extra: state.rpc.extra
  }),
  (dispatch) => ({
    reconnect(){
      rpc.connect()
    }
  })
)(ConnectionBannerView)

export default ConnectionBanner
