const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');

var getNavigate = (req, resp) => {
  var params = qs.parse(req.body);
  mysqlOpt.exec(
    "select * from tabbar",
    mysqlOpt.formatParams(params),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )
};

module.exports = {
  getNavigate
};