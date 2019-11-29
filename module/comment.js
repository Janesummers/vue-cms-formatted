const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');

var getComments = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let pageNo = params.pageNo ? parseInt(params.pageNo) : 1;
  let pageSize = params.pageSize ? parseInt(params.pageSize) : 3;
  mysqlOpt.exec(
    `select * 
     from comments  
     where belongId = ?
     limit ?,?`,
    mysqlOpt.formatParams(params.belongId, (pageNo - 1) * pageSize, pageSize),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )
};

var addComment = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.id || params.belongId.length !== 19) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `insert into comments
     values (?,?,?,?,?,?)`,
    mysqlOpt.formatParams(params.id, params.userName, params.time, params.content, params.belongId, params.userId),
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
  getComments,
  addComment
};