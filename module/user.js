const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');
const util = require('../util/util');


var login = (req, resp) => {
  var user = qs.parse(req.body);
  if (!user || !user.name || !user.pwd) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    "select * from user where unionid = ? and password = ?",
    mysqlOpt.formatParams(user.name, user.pwd),
    res => {
      if (res.length > 0) {
        resp.json(msgResult.msg({nick: res[0].username, id: res[0].id}));
      } else {
        resp.json(msgResult.error("用户名或者密码错误"));
      }
    },
    e => {
      resp.end(msgResult.error(e.message));
    }
  )
};

var register = (req, resp) => {
  var user = qs.parse(req.body);
  if (!user || !user.name || !user.pwd || !user.nick) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let id = util.randomNumber();
  mysqlOpt.exec(
    "insert into user values (?,?,?,?)",
    mysqlOpt.formatParams(id, user.name, user.nick, user.pwd),
    () => {
      resp.json(msgResult.msg("注册成功"));
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.json(msgResult.error("nick/name已存在"));
    }
  )
};






module.exports = {
  login,
  register
};