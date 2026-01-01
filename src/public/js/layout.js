document.querySelectorAll('.nav-link').forEach(a=>{
  if(a.getAttribute('href')===location.pathname){a.classList.add('active');}
});
