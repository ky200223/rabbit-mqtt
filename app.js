/**
 * Created by YoungKim on 2014. 8. 21
 */

'use strict';

var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser');

/**
 * connect to Mosquitto, rabbitMQ to consume push message
 */

var connection = require('mqtt').connect('mqtt://localhost');
var q = 'push';
function bail(err) {
    console.error(err);
    process.exit(1);
}

//mosquitto consumer
function consumer(conn) {
    var ok = conn.createChannel(on_open);

    function on_open(err, ch) {
        if (err != null) {
            bail(err);
        }
        ch.assertQueue(q, {durable: true}, function (err, _ok) {
            ch.consume(q, function (msg) {
                if (msg !== null) {
                    console.log(msg.content.toString());
                    connection.publish('push_group', msg.content.toString(), {qos: 2});
                    ch.ack(msg);
                }
            })
        })
    }
}

//connect to RabbitMQ and start consumer
require('amqp').connect('amqp://localhost', function (err, conn) {
    if (err != null) {
        bail(err);
    }
    consumer(conn);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
