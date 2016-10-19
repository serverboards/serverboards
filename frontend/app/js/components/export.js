// Components that will be exported to be used at plugins. Mainly third party.
import {MarkdownPreview} from 'react-marked-markdown'
import ActionEdit from 'app/components/rules/actionedit'
import Loading from './loading'
import Modal from './modal'

const components = {
  Modal,
  Loading,
  MarkdownPreview,
  ActionEdit
}

export default components
