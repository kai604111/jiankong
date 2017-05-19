var nodemailer = require('nodemailer');
var log = require('./logHelper').helper;
var mailers_conf = require('../conf/mailers_conf').config;

// 配置合法性判断
if (mailers_conf) {
    if (mailers_conf.create == null) throw new Error('mailers_conf.create is not defined');
} else {
    throw new Error('mailers_conf is not defined');
}
var mail = nodemailer.createTransport(mailers_conf.create);

function isMailBox(str) {
    if (str === undefined || str === '' || str === null) return false;
    var _reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
    return _reg.test(str);
}

var helper = {};
helper.send = function (sub, text, sel) {
    if (!sub) sub = '';
    if (!text) text = '';
    if (!sel) sel = 'monitor';
    var opt = {
        from: mailers_conf[sel].form,
        to: mailers_conf[sel].to,
        cc: mailers_conf[sel].cc,
        subject: sub,
        text: text
    };
    if (!isMailBox(opt.from)) {
        throw new Error('邮件没有发送者');
        return;
    }
    if (!isMailBox(opt.to)) {
        throw new Error('邮件没有接受者');
        return;
    }
    mail.sendMail(opt, function (error, info) {
        if (error) {
            log.writeErr('mail is not send,please check the error', error);
            return;
        }
        log.writeInfo('send mail to -> ' + opt.to + '  ' + sub + '   ' + text);
    });
};
exports.helper = helper;