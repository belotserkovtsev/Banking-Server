const mysql = require('mysql');

const pool = mysql.createPool({
    host: '127.0.0.1',
    database: 'bank',
    user: 'root',
    password: 'F#C#helloWorld'
});

class User{
    static add(){
        
    }

    static checkPassword(login, password){
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if(err)
                    reject (err)
                connection.query(`select * from users where username = "${login}" and password = "${password}"`, (err, rows) => {
                    connection.release();

                    if(err){
                        reject(err)
                    }

                    if(rows.length && rows[0].password == password)
                        resolve(rows);
                    else
                        reject('Wrong pass');
                })
            })
        })
        .catch(err => {
            return false;
        })
    }

    static get(login){
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {

                if(err){
                    reject(err);
                }

                connection.query(`select * from users where username = "${login}"`, (err, rows) => {
                    connection.release();

                    if(err){
                        reject(err);
                    }

                    resolve(rows);
                });
            });
        }).catch(err => {
            return false;
        })
    }

    static delete(){

    }
}

module.exports = User;