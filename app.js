const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const consolidate = require('consolidate');

const User = require('./models/user.js');

const AsyncLock = require('async-lock');
const lock = new AsyncLock();

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
    let userdata = await User.check(username, password);
    if(!userdata){
        return done(null, false);
    }
    return done(null, userdata[0]);
}))

passport.serializeUser((user, done) => {
    done(null, user.username);
})

passport.deserializeUser((user, done) => {
    User.get(user)
    .then(res => {
        done(null, res[0]);
    })
    .catch(err => {
        done(null, false);
    })
    
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
    res.render('register', {
        username: req.query.username,
        password: req.query.password,
        firstname: req.query.firstname,
        lastname: req.query.lastname
    });
});

app.post('/register', async (req, res) => {
    if(!req.body.username || !req.body.firstname || !req.body.lastname || !req.body.password)
        res.redirect(`/register?username=${req.body.username}&firstname=${req.body.firstname}&lastname=${req.body.lastname}`);
    else{
        User.exists(req.body.username)
        .then(resp => {
            console.log('user exists');
            res.redirect(`/register?firstname=${req.body.firstname}&lastname=${req.body.lastname}`);
        })
        .catch(err => {
            console.log(err.message);
            User.add(req.body.username, req.body.firstname, req.body.lastname, req.body.password)
            .then(resp => {
                res.redirect('/');
            })
            .catch(err => {
                console.log(err.message);
                res.redirect('/');
            })
        })
    }
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

app.post('/user/add-balance', (req, res) => {
    if(req.body.amount > 0){
        User.addBalance(req.user.username, req.body.amount)
        .catch(err => {
            console.log('Error with adding balance')
        })
    }
    res.redirect('/user');
});

app.post('/user/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.post('/user/transfer', (req, res) => {
    User.exists(req.body.to)
    .then(res => {
        if(req.body.amount > 0){
            lock.acquire(req.user.username, () => {
                return User.isBalance(req.body.amount, req.user.username)
                .then(res => {
                    return User.transfer(req.user.username, req.body.to, req.body.amount);
                })
            }, [])
            .then(res => {
                console.log('lock released')
            })
            .catch(err => {
                console.log(err.message);
            })
        }
        else{
            throw new Error('Amount is less than 0 or amount is more than you have');
        }
    })
    .catch(err => {
        console.log(err.message)
    })
    
    res.redirect('/user');
})

app.listen(8888);