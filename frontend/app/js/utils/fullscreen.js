// From https://www.sitepoint.com/use-html5-full-screen-api/

export function request_fullscreen(i){
  if (i.requestFullscreen) {
  	i.requestFullscreen();
  } else if (i.webkitRequestFullscreen) {
  	i.webkitRequestFullscreen();
  } else if (i.mozRequestFullScreen) {
  	i.mozRequestFullScreen();
  } else if (i.msRequestFullscreen) {
  	i.msRequestFullscreen();
  }
}
export function exit_fullscreen(){
  if (document.exitFullscreen) {
  	document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
  	document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
  	document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
  	document.msExitFullscreen();
  }
}
