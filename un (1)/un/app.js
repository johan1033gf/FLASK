const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const app = express();
/* const sesision = require('express-session'); */
// Configurar middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
/* app.use(sesision({
  secret:'',
  resave:false,
  saveUninitialized:false
})); */
//Creacion de la coneccion
const db = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'unman'  
  };

//Crear usuarios
app.post('/crear', async (req,res)=>{
    const { Nombre, Tipo, Documento,Contraseña,id_manzanas} = req.body; 
    const soli = await mysql.createConnection(db);
    try{
    //Verificador de usuario
    const [indicador]=await soli.execute('SELECT * FROM usuario WHERE Documento=? AND Tipo=? AND id_manzanas=?',[Documento,Tipo,id_manzanas]);
    if(indicador.length>0){
      res.status(409).send(`
      <script>
      window.onload = function(){
        alert("Este Usuario Ya Existe 🫠");
        window.location.href = '/Ingreso.html';
      }
    </script>
      `)
      await soli.end();
    }
    else{
      await soli.execute('INSERT INTO usuario (Nombre, Tipo,Documento,Contraseña,id_manzanas) VALUES (?, ?,?,?,?)',
    [Nombre, Tipo,Documento,Contraseña,id_manzanas]);
    res.status(201).send(`
    <script>
      window.onload = function(){
        alert("Datos Guardados 😎 Inicia Sesión Para Continuar.");
        window.location.href = '/inicio.html'; 
      }
    </script>
    `)}
    await soli.end();
    }
    catch(error){
        console.error('Error en el servidor:', error);
        res.status(500).send(`
        <script>
          window.onload = function(){
            alert("Error: Este usuario ya existe... 🫤");
            window.location.href = '/Ingreso.html';
          // }/*  */
        </script>
        `)
    }

})
//Ruta para manejar Login
app.post('/inicia', async(req,res)=>{
  const {Tipo,Documento,Contraseña}= req.body
  const soli = await mysql.createConnection(db);
  try{
    //Verifique las credenciales
    const [indicador]=await soli.execute('SELECT * FROM usuario WHERE Documento=? AND Tipo=? AND Contraseña=?',[Documento,Tipo,Contraseña]);
    console.log(indicador);
    if(indicador.length>0){
      /* req.session.usuario = rows[0].Nombre; */
      res.redirect(`/bienvenido?usuario=${indicador[0].Nombre}`);
    }
    else{
      res.status(401).send(`
      <script>
        window.onload = function(){
          alert("Usuario No Encontrado 😵‍💫 Verifica Tus Datos e Intenta Nuevamente. 😋");
          window.location.href = '/inicio.html';
        }
      </script>
      `)
    }
    await soli.end();
  }
  catch(error){
    console.error("Error En El Servidor",error);
    res.status(500).send(`

    <script>
      window.onload = function(){
        alert("Error En El Servidor 🤕");
        window.location.href = '/inicio.html'; 
      }
    </>
    `)
  }
})
app.get('/bienvenido',(req,res)=>{
  res.sendFile(__dirname+'/usuario.html')
})
//Obtener Servcios
app.post('/obtener-servicios-usuario',async(req,res)=>{
  const {usuario}= req.body
  console.log(usuario);
  const soli = await mysql.createConnection(db);
  try{
    const [serviciosData]= await soli.execute('SELECT servicios.Nombre FROM usuario INNER JOIN manzanas ON usuario.id_manzanas= manzanas.id_manzanas INNER JOIN manzana_servicios ON manzanas.id_manzanas= manzana_servicios.id_m INNER JOIN servicios ON manzana_servicios.id_s=servicios.id_servicios WHERE usuario.Nombre=?',[usuario]);
    console.log(serviciosData);
    res.json({servicios: serviciosData.map(row=>row.Nombre)})
  await soli.end();
  }
  catch(error){
    console.error('Error Al Obtener Servicios:☠️',error);
    res.status(500).send('Error En El Servidor.. :c');
  }
})
//Guardar Servicios
app.post('/guardar-servicios-usuario',async(req,res)=>{
  const {usuario,servicios,fechaHora}= req.body
  const soli = await mysql.createConnection(db);
const[consultId]= await soli.query('SELECT usuario.id_user, servicios.id_servicios FROM usuario INNER JOIN servicios WHERE usuario.Nombre=? AND servicios.Nombre=?',[usuario,servicios])
/* const[codserv]= await db.query('SELECT servicios.id_servicios FROM usuario INNER JOIN manzanas ON usuario.id_manzanas= manzanas.id_manzanas INNER JOIN manzana_servicios ON manzanas.id_manzanas= manzana_servicios.id_m INNER JOIN servicios ON manzana_servicios.id_s=servicios.id_servicios WHERE servicios.Nombre=?',[servicios]) */
console.log(consultId);
console.log(fechaHora);
  try{
    for(const servicio of servicios){
      await soli.query('INSERT INTO solicitudes (Fecha, Id1, CodigoS ) VALUES (?,?,?)',[fechaHora,consultId[0].id_user,consultId[0].id_servicios]);
    }
    await soli.end();
  }
  catch(error){
    console.error('Error En El Servidor:',error); 
    res.status(500).send('Error En El Servidor.. :c');
  
  }
})
//Mostrar Servicios
app.post('/mostrar-servicios-usuario',async(req,res)=>{
  const {usuario} = req.body;
  console.log(usuario);
  try{  
    const soli = await mysql.createConnection(db);
    const [solicitudData] = await soli.execute('SELECT solicitudes.Fecha, servicios.Nombre FROM solicitudes INNER JOIN usuario ON solicitudes.Id1 = usuario.id_user INNER JOIN manzanas ON usuario.id_manzanas = manzanas.id_manzanas INNER JOIN manzana_servicios ON manzanas.id_manzanas = manzana_servicios.id_m INNER JOIN servicios ON manzana_servicios.id_s = servicios.id_servicios WHERE usuario.Nombre=? AND solicitudes.CodigoS = servicios.id_servicios',[usuario]);
    console.log(solicitudData);
    res.json({mostr: solicitudData.map(raw => ([raw.Nombre, raw.Fecha]))});
    await soli.end();
  }
  catch(error){
    console.error('Error Al Mostrar Servicios... 💀 ',error);
    res.status(500).send('Error En El Servidor... ☠️');
  }
});
//Eliminar Servicios
app.post('/eliminar-servicios-usuario',async(req,res)=>{
  const{usuario,solicitudes} = req.body;
  
})

app.listen(3000, () => {
    console.log(`Servidor Node.js activo 🕴️`);
  }) 
