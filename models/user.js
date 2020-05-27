const mysql = require('mysql');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const pool = mysql.createPool({
    host: '127.0.0.1',
    database: 'bank',
    user: 'root',
    password: 'F#C#helloWorld'
});

class User{

    static add(username, firstname, lastname, password){
        return new Promise((resolve, reject) => {
            pool.getConnection(async (err, connection) => {
                if(err){
                    connection.release();
                    reject(err);
                }
                // let passHash = passwordHash.generate(password);
                let hashPass = await bcrypt.hash(password, saltRounds);
                // console.log(passHash);
                connection.query('insert into users (username, firstname, lastname, password, balance) values (?, ?, ?, ?, 0)', [username, firstname, lastname, hashPass], (err, rows) => {
                    connection.release();

                    if(err){
                        reject(err);
                    }

                    resolve(rows);

                })
            })
        })
    }

    static exists(username){
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if(err){
                    connection.release();
                    reject (err)
                }
                connection.query(`select * from users where username = "${username}"`, (err, rows) => {
                    connection.release();

                    if(err){
                        reject(err)
                    }

                    if(!rows.length)
                        reject(new Error('No user found!'))

                    resolve(true);
                })
            })
        })
    }

    static addBalance(username, amount){
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if(err){
                    connection.release();
                    reject(err);
                }
                connection.query('update users set balance = balance + ? where username = ?', [amount, username], (err, rows) => {
                    connection.release();

                    if(err){
                        reject(err);
                    }

                    resolve(rows);

                })
            })
        })
    }

    static check(login, password){
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {

                if(err){
                    connection.release();
                    reject(err);
                }

                connection.query(`select * from users where username = ?`, [login], (err, rows) => {
                    connection.release();
                    if(err){
                        reject(err);
                    }

                    if(!rows.length){
                        reject('No user found')
                    }
                    // console.log(rows[0])
                    bcrypt.compare(password, rows[0].password, (err, result) => {
                        if(err)
                            reject (err);
                        if(result)
                            resolve(rows);
                        else
                            reject('Passwords dont match')
                    });

                    
                });
            });
        })
    }

    static get(login){
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {

                if(err){
                    connection.release();
                    reject(err);
                }

                connection.query(`select * from users where username = ?`, [login], (err, rows) => {
                    connection.release();

                    if(err){
                        reject(err);
                    }

                    if(!rows.length){
                        reject('No user found')
                    }

                    resolve(rows);

                    
                });
            });
        })
    }

    /* static isBalance(amount, user){
        return new Promise((resolve, reject) => {
            pool.getConnection(async (err, connection) => {

                if(err){
                    connection.release();
                    reject(err);
                }
                
                connection.query(`select balance from users where username = ?`, [user], (err, rows) => {
                    connection.release();

                    if(err){
                        reject(err);
                    }
                    console.log('checking balance');
                    if(rows[0].balance >= amount){
                        resolve(rows[0].balance);
                    }
                    else{
                        reject(new Error('Not enough'))
                    }

                    
                });
            });
        })
    } */

    static transfer(from, to, amount){
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if(err){
                    connection.release();
                    reject(err);
                    return;
                }
                connection.beginTransaction((err) => {
                    
                    if(err){
                        connection.release();
                        reject(err);
                        return;
                    }
                    connection.query('update users set balance = balance - ? where username = ?', [amount, from], (err, rows) => {
                        if(err){
                            connection.rollback(() => {
                                connection.release();
                                reject(err);
                                return;
                            })
                        }
                        console.log('transfering...')
                        connection.query('update users set balance = balance + ? where username = ?', [amount, to], (err, rows) => {
                            if(err){
                                connection.rollback(() => {
                                    connection.release();
                                    reject(err);
                                    return;
                                })
                            }
                            connection.commit((err) => {
                                if(err){
                                    connection.rollback(() => {
                                        connection.release();
                                        reject(err);
                                        return;
                                    })
                                }
                                resolve(true);
                            })
                        })
                    })
                })
                
            })
        })
    }
}

module.exports = User;