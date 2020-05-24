const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const consolidate = require('consolidate');

const User = require('./models/user.js');

const app = express();

app.engine('hbs', consolidate.handlebars);
app.set('view engine', 'hbs')
app.set('views', './views')

app.use(cookieParser('secret'))
app.use(bodyParser.urlencoded()); 

app.use(session({keys:['secret']}))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(async (username, password, done) => {
    let userdata = await User.get(username);
    if(!userdata){
        return done(null, false);
    }
    if(!await User.checkPassword(username, password)){
        return done(null, false);
    }
    // console.log(userdata[0])
    return done(null, userdata[0]);
}))

passport.serializeUser((user, done) => {
    // console.log(user);
    done(null, user.username);
})

passport.deserializeUser(async (user, done) => {
    let userdata = await User.get(user);
    done(null, userdata[0]);
})

const auth = passport.authenticate('local', {
    'successRedirect': `/user`,
    'failureRedirect': '/'
})

app.get('/', (req, res) => {
    if(!req.isAuthenticated())
        res.render('index', {});
    else
        res.redirect('/user')
});

app.post('/', auth);

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    console.log(req);
    User.add(req.body.username, rew.body.firstname, req.body.lastname, req.body.password);
})

const mustBeAuth = (req, res, next) => {
    if(req.isAuthenticated()){
        next();
    }
    else{
        res.redirect('/');
    }
}

app.all('/user', mustBeAuth);
app.all('/user/*', mustBeAuth);

app.get('/user', (req, res) => {
    res.render('userpage', {
        name: req.user.firstname,
        balance: req.user.balance,
        username: req.user.username
    });
})

app.listen(8888);