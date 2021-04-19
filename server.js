'use strict';

const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const methodeoverride = require('method-override');

require('dotenv').config();

const PORT = process.env.PORT || 3010;
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;
const options = NODE_ENV === 'production' ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } } : { connectionString: DATABASE_URL };
const client = new pg.Client(options);

const app = express();
// const client = new pg.Client(DATABASE_URL);

app.use(express.urlencoded({extended:true}));
app.use(methodeoverride('_method'));
app.use(express.static('./public'));

app.set('view engine','ejs');


client.connect().then(()=> app.listen( PORT , ()=> console.log(`I'm listen in ${PORT}`)));

app.get('/home',handleHome);
app.get('/character/my-fav-characters',handleFavChar);
app.get('/character/:character_id',handleDetails);
app.get('/characters', handleCreate);
app.get('/characters/my-characters', handleChar);
app.post('/favorite-character',handleSave);
app.post('/characters',handleSaveCreate);
app.put('/character/:character_id',handleUpdate);
app.delete('/character/:character_id',handleDelete);

app.use('*', handleError);

function handleError(req,res){
  console.log('error wrong route');
  res.render('error');
}

function handleHome(req,res){
  const url = 'http://hp-api.herokuapp.com/api/characters';

  superagent.get(url).then(data=> {
    // console.log(data.body);
    const arr = data.body.map(charInfo => new Character(charInfo));
    res.render('index', {data : arr});
  })
    .catch(error=> console.log('api error'));
}

function handleSave(req,res){
  const {name,house,patronus,alive}= req.body;
  const sql = 'INSERT INTO characters (name,house,patronus,alive,creat_by) VALUES ($1,$2,$3,$4,$5);';
  const values = [name,house,patronus,alive,'api'];
  client.query(sql,values).then(() =>{
    res.redirect('/character/my-fav-characters');
  })
    .catch(error=> console.log('save to DB error'));
}

function handleFavChar(req,res){
  const sql = 'SELECT * FROM characters WHERE creat_by=$1;';
  const value = ['api'];
  client.query(sql,value).then(result =>{
    res.render('show-ch', {data : result.rows});
  })
    .catch(error=> console.log('get api data from DB error'));
}

function handleDetails(req,res){
  const id = req.params.character_id;
  const sql = 'SELECT * FROM characters WHERE id=$1;';
  const value = [id];
  client.query(sql,value).then(result =>{
    res.render('one-ch', {data : result.rows[0]});
  })
    .catch(error=> console.log('get one char data from DB error'));
}

function handleUpdate(req,res){
  const id = req.params.character_id;
  const {name,house,patronus,alive}= req.body;
  const sql = 'UPDATE characters SET name=$1 , house=$2 ,patronus=$3 ,alive=$4 WHERE id = $5;';
  const values = [name,house,patronus,alive,id];
  client.query(sql,values).then(() =>{
    res.redirect(`/character/${id}`);
  })
    .catch(error=> console.log('update to DB error'));
}

function handleDelete(req,res){
  const id = req.params.character_id;
  const sql = 'DELETE FROM characters WHERE id =$1;';
  client.query(sql,[id]).then(() =>{
    res.redirect('/character/my-fav-characters');
  })
    .catch(error=> console.log('delete from DB error'));

}

function handleCreate(req,res){
  res.render('create-char');
}

function handleSaveCreate(req,res){
  const {name,house,patronus,alive}= req.body;
  const sql = 'INSERT INTO characters (name,house,patronus,alive,creat_by) VALUES ($1,$2,$3,$4,$5);';
  const values = [name,house,patronus,alive,'user'];
  client.query(sql,values).then(() =>{
    res.redirect('/characters/my-characters');
  })
    .catch(error=> console.log('save to DB error'));
}

function handleChar(req,res){
  const sql = 'SELECT * FROM characters WHERE creat_by=$1;';
  const value = ['user'];
  client.query(sql,value).then(result =>{
    res.render('show-ch', {data : result.rows});
  })
    .catch(error=> console.log('get user data from DB error'));
}

function Character (info){
  this.name = info.name;
  this.house = info.house;
  this.patronus = info.patronus;
  this.alive = info.alive;
}
