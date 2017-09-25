// Components that will be exported to be used at plugins. Mainly third party.
import {MarkdownPreview} from 'react-marked-markdown'
import ActionEdit from 'app/components/rules/actionedit'
import Loading from './loading'
import Modal from './modal'
import HoldButton from './holdbutton'
import GenericForm from './genericform'
import Calendar from './calendar'
import Error from './error'
import Tip from './tip'
import Logs from './logs'
import IconIcon from './iconicon'
import PluginScreen from './plugin/screen'
import Selector from './selector'
import Panes from './panes'

const components = {
  Modal,
  Loading,
  MarkdownPreview,
  ActionEdit,
  HoldButton,
  GenericForm,
  Calendar,
  Error,
  Tip,
  Logs,
  IconIcon,
  PluginScreen,
  Selector,
  Panes
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
  ActionEdit,
  HoldButton,
  GenericForm,
  Calendar,
  Error,
  Tip,
  Logs,
  IconIcon,
  PluginScreen,
  Selector,
  Panes
}
