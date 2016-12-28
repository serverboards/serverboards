import rpc from 'app/rpc'
import slash from 'app/utils/slash'

const slashf=slash.factory({
  tag: (tags, context) => {context.tags=(context.tags || []).concat(tags)},
  tags: (tags, context) => {context.tags=(context.tags || []).concat(tags)},
  label: (tags, context) => {context.tags=(context.tags || []).concat(tags)},
  labels: (tags, context) => {context.tags=(context.tags || []).concat(tags)},
  untag: (tags, context) => {context.untag=(context.untag || []).concat(tags)},
  unlabel: (tags, context) => {context.untag=(context.untag || []).concat(tags)},
  close: (tags, context) => {context.close=true},
  closed: (tags, context) => {context.close=true},
  open: (tags, context) => {context.open=true},
  reopen: (tags, context) => {context.open=true},
})

// Adds a comment, parses slash commands
export function parse_comment(comment_raw){
  let context = {}
  const comment = slash.parse( comment_raw, slashf, context)
  let updates=[]
  if (comment.trim().length>0)
    updates.push({ type: "comment", data: comment })
  if (context.tags){
    updates.push({ type: "set_labels", data: context.tags})
  }
  if (context.untag){
    updates.push({ type: "unset_labels", data: context.untag})
  }
  if (context.open){
    updates.push({ type: "change_status", data: "open"})
  }
  if (context.close){
    updates.push({ type: "change_status", data: "closed"})
  }
  return updates
}

export function update_issue(issue_id, update){
  return rpc.call("issues.update", [Number(issue_id), update])
}

export function update_issue_multi(issue_id, updates){
  return rpc.call("issues.update", [Number(issue_id), updates])
}
