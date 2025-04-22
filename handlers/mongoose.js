const mongoose = require('mongoose');

module.exports = (client) => {

    mongoose.connect("mongodb://localhost:27017/")
        .then(() => {
            console.log('MongoDB’ye başarıyla bağlanıldı!');
        })
        .catch(err => console.error('MongoDB bağlantı hatası:', err));

};