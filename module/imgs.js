const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');
const getDataUtil = require('./getDataUtil');

var getImages = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let pageNo = params.pageNo ? parseInt(params.pageNo) : 1;
  let pageSize = params.pageSize ? parseInt(params.pageSize) : 4;
  mysqlOpt.exec(
    `select * from imgs 
     where belongId = ?
     limit ?,?`,
    mysqlOpt.formatParams(params.belongId, (pageNo - 1) * pageSize, pageSize),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  )
};

var setImages = (req, resp) => {
  getDataUtil.setImg(req, resp);
};

module.exports = {
  getImages,
  setImages
};