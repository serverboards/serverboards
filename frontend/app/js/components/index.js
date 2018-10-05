// Components that will be exported to be used at plugins. Mainly third party.
import {MarkdownPreview} from 'react-marked-markdown'
import Loading from './loading'
import Modal from './modal'
import HoldButton from './holdbutton'
import GenericForm from './genericform'
import Calendar from './calendar'
import {Error, ErrorBoundary} from './error'
import Tip from './tip'
import Logs from './logs'
import IconIcon from './iconicon'
import PluginScreen from './plugin/screen'
import Selector from './selector'
import MarketplaceSelector from 'app/containers/marketplaceselector'
import Panes from './panes'
import QueryServiceSelect from 'app/containers/board/queryserviceselect'
import ExtractorsHelp from './board/extractorshelp'
import FutureLabel from './futurelabel'
import Restricted from 'app/restricted'
import CodeMirror from './codemirror'
import SectionMenu from 'app/containers/menu'
import Hooks from 'app/containers/hooks'

const components = {
  Modal,
  Loading,
  MarkdownPreview,
  HoldButton,
  GenericForm,
  Calendar,
  Error,
  ErrorBoundary,
  Tip,
  Logs,
  IconIcon,
  PluginScreen,
  Selector,
  MarketplaceSelector,
  Panes,
  QueryServiceSelect,
  ExtractorsHelp,
  FutureLabel,
  Restricted,
  CodeMirror,
  SectionMenu,
  Hooks,
}

// Export as default, and as destructuring.
// This allows both :
// * `import Components from 'export'`
// * `import {Modal} from 'export'`
export default components
export {
  Modal,
  Loading,
  MarkdownPreview,
  HoldButton,
  GenericForm,
  Calendar,
  Error,
  ErrorBoundary,
  Tip,
  Logs,
  IconIcon,
  PluginScreen,
  Selector,
  MarketplaceSelector,
  Panes,
  QueryServiceSelect,
  ExtractorsHelp,
  FutureLabel,
  Restricted,
  CodeMirror,
  SectionMenu,
  Hooks,
}
