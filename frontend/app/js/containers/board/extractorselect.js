import connect from 'app/containers/connect'
import ExtractorSelectView from 'app/components/board/extractorselect'
import { services_update_catalog, services_update_all } from 'app/actions/service'
import cache from 'app/utils/cache'

const ExtractorSelect = connect({
  state: (state, props) => {
    const project = state.project.current
    const all_services = ( state.services.services || []).filter( s => s.projects.indexOf(project)>=0)

    return {
      all_services
    }
  },
  promises: () => ({
    known_extractors: cache.plugin_component({type: "extractor"})
  }),
  handlers: (dispatch) => ({
  }),
  store_enter: [services_update_all]
})(ExtractorSelectView)

export default ExtractorSelect
