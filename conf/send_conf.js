exports.config = {
    // 邮件发送配置
    mails: {
        form: 'liwenyang@joyutech.com',
        to: 'liwenyang@joyutech.com',
        cc: 'yuanfanglin@joyutech.com,yangzheng@joyutech.com,chenhongyu@joyutech.com,lengweiping@joyutech.com,guoziao@joyutech.com,wangzhenkai@joyutech.com'
    },
    //邮件配置：from发送方，to接收方，cc配置邮件抄送对象。subject邮件主题，text邮件的内容。
    erroroption: {
        from: mails.form,
        to: mails.to,
        cc: mails.cc,
        subject: "湖北监控出错",
        text: "服务器挂掉了，请尽快处理。"
    },
    restartoption: {
        from: mails.form,
        to: mails.to,
        cc: mails.cc,
        subject: "湖北监控恢复",
        text: "服务器已恢复。"
    },
    //配置邮件的服务商与协议
    createMailerConf: {
        host: "smtp.exmail.qq.com",
        server: 'qq',
        port: 465,//配置SMTP端口
        secureConnection: true, //SSL加密通道，防止邮件被截获
        //auth设置使用SMTP协议的邮箱以及授权码
        auth: {
            user: 'liwenyang@joyutech.com',
            pass: 'Joyu1201'
        }
    }
};
