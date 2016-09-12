import ServiceSettings from 'app/containers/service/settings'
import VirtualServices from 'app/components/service/virtual'

export function get_modal(name){
  switch(name){
    case "service_settings":
      return ServiceSettings
    case "virtual_services":
      return VirtualServices
  }
}

export default get_modal
