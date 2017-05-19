exports.config = {
    statusFile: 'http://116.210.254.248/moniter.json',
    isStop: false,
    check_time: 5,
    webServer: {
        "sport": {
            "static_url": "http://116.210.254.227/app/static/js/keyCode.js",
            "isVPN": 0,
            "restart": true
        },
        "labei": {
            "static_url": "http://116.210.254.227/app/static/js/keyCode.js",
            "isVPN": 0,
            "restart": true
        }
    },
    warnFlag: {
        "disk": 80,
        "nginx": 0,
        "mysql_status": 0,
        "mysql_slave": 2
    }
};
