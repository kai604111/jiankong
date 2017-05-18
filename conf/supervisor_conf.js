exports.config = {
// 邮件发送配置
    mails: {
        form: 'liwenyang@joyutech.com',
        to: 'wangzhenkai@joyutech.com',
        cc: 'wangzhenkai@joyutech.com'
    },
//邮件配置：from发送方，to接收方，cc配置邮件抄送对象。subject邮件主题，text邮件的内容。
    erroroption: {
        from: mails.form,
        to: mails.to,
        cc: mails.cc,
        subject: "监督服务",
        text: "湖北监控服务异常，请及时修复！"
    },
    restartoption: {
        from: mails.form,
        to: mails.to,
        cc: mails.cc,
        subject: "监督服务",
        text: "湖北监控服务已恢复。"
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

