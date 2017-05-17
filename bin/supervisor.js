/**
 * mail.js监控服务的监督者
 */
var http = require('http');
var nodemailer = require('nodemailer'); //nodemailer模块，用于发送邮件
var port = 30000;
var lastNotifyTime = null;

// 邮件发送配置
var mails = {
    form: 'liwenyang@joyutech.com',
    to: 'wangzhenkai@joyutech.com',
    cc: 'wangzhenkai@joyutech.com'
};
//邮件配置：from发送方，to接收方，cc配置邮件抄送对象。subject邮件主题，text邮件的内容。
var erroroption = {
    from: mails.form,
    to: mails.to,
    cc: mails.cc,
    subject: "湖北监控服务异常",
    text: "湖北监控服务异常，请及时修复！"
};
var restartoption = {
    from: mails.form,
    to: mails.to,
    cc: mails.cc,
    subject: "湖北监控服务已恢复",
    text: "湖北监控服务已恢复。"
};
//配置邮件的服务商与协议
var mail = nodemailer.createTransport({
    host: "smtp.exmail.qq.com",
    server: 'qq',
    port: 465,//配置SMTP端口
    secureConnection: true, //SSL加密通道，防止邮件被截获
    //auth设置使用SMTP协议的邮箱以及授权码
    auth: {
        user: 'liwenyang@joyutech.com',
        pass: 'Joyu1201'
    }
});
var server = http.createServer(function (req, res) {
    console.log('URL: ' + req.url);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('我还活着\n');
    lastNotifyTime = new Date().getTime();
    console.log("lastNotifyTime : " + lastNotifyTime);
    if (!restart && isRecoverSend) {
        mail.sendMail(restartoption, function (error, info) {
            console.log('mail_error: ' + error);
            var date = new Date();
            console.log(date + '湖北监控服务异常已恢复');
            restart = true;
            isRecoverSend = true;
        });
    }
});
server.listen(port, function () {
    // nginx 代理url http://115.231.111.183/hubei_jiankong_heartbeat
    console.log('Server running at http://127.0.0.1:30000/');
});

var restart = true; //restart 判断程序是否已启动
var isErrorSend = true; //isErrorSend 判断是否发送过故障邮件 避免重复发送
var isRecoverSend = true; //isRecoverSend 判断是否发送过恢复邮件 避免重复发送
setInterval(function () {
    var currentTime = new Date().getTime();
    if (currentTime - lastNotifyTime > 5 * 60 * 1000) {
        //5分钟内，没收到消息，就认为监控工具死了，我要发邮件
        if (restart && isErrorSend) {
            mail.sendMail(erroroption, function (error, info) {
                console.log('mail_error: ' + error);
                var date = new Date();
                console.log(date + '湖北监控服务异常，请及时修复！');
                restart = false;
                isErrorSend = false;
            });
        }
    }
}, 60 * 1000);//检测频率 60S一次
