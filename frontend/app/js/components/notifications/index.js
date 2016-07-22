export function label_color(l){
  switch (l) {
    case "new":
      return "green"
      break;
    case "unread":
      return "yellow"
      break;
    default:
      return ""
  }
}
