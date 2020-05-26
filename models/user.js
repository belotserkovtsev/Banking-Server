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

    static async add(username, firstname, lastname, password){
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
        .catch(err => {
            return false;
        });
    }

    static async exists(username){
        return new Promise((resolve, reject) => {
            pool.getConnection(async (err, connection) => {
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
                        reject('No user found!')

                    resolve(rows);
                })
            })
        })
        .catch(err => {
            return false;
        })
    }

    static async addBalance(username, amount){
        return new Promise((resolve, reject) => {
            pool.getConnection(async (err, connection) => {
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
        .catch(err => {
            return false;
        });
    }

    static async check(login, password){
        return new Promise((resolve, reject) => {
            pool.getConnection(async (err, connection) => {

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
        }).catch(err => {
            return false;
        })
    }

    static async get(login){
        return new Promise((resolve, reject) => {
            pool.getConnection(async (err, connection) => {

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
        }).catch(err => {
            return false;
        })
    }

    static transfer(from, to, amount){
        return new Promise((resolve, reject) => {
            pool.getConnection(async (err, connection) => {
                if(err){
                    connection.release();
                    reject(err);
                    return;
                }
                new Promise((resolve, reject) => {
                    connection.query(`select balance from users where username = ?`, [from], (err, rows) => {
                        if(err){
                            connection.release();
                            return reject(false);
                        }
                        if(rows[0].balance < amount){
                            connection.release();
                            return reject(false);
                        }
                        resolve(true);
                    })
                })
                .then(res => {
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
                .catch(err => {
                    return reject(false);
                })

                
            })
        })
    }
}

module.exports = User;