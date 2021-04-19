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
app.post('/favorite-character',handleSave);

app.use('*', handleError);

function handleError(req,res){
  console.log('error wrong route');
  res.render('error');
}

function handleHome(req,res){
  const url = 'http://hp-api.herokuapp.com/api/characters';

  superagent.get(url).then(data=> {
    console.log(data.body);
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

function Character (info){
  this.name = info.name;
  this.house = info.house;
  this.patronus = info.patronus;
  this.alive = info.alive;
}
