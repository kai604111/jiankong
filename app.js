var monitor = require('./bin/monitor').monitor;
var supervisor = require('./bin/supervisor').supervisor;
monitor.run();
supervisor.run();