$(document).ready(function() {
  setProjectsCount();
});


function setProjectsCount() {
  const numberOf = $('#projects li').length;
  $('#projects').css('--project-count', numberOf);
}
