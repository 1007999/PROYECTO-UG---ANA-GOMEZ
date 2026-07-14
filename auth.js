'use strict';
const $=s=>document.querySelector(s);
function entrar(){
  const rol=$('#rol').value, usuario=$('#usuario').value.trim(), clave=$('#clave').value;
  const valido=(rol==='estudiante'&&usuario==='estudiante'&&clave==='1234')||(rol==='admin'&&usuario==='admin'&&clave==='admin123');
  if(!valido){$('#mensajeLogin').textContent='Usuario o contraseña incorrectos.';return;}
  sessionStorage.setItem('tallerSesion',JSON.stringify({rol,usuario,fecha:Date.now()}));
  location.href=rol==='admin'?'admin.html':'estudiante.html';
}
$('#btnIngresar').addEventListener('click',entrar);
document.addEventListener('keydown',e=>{if(e.key==='Enter')entrar()});
