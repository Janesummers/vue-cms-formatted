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
  mysqlOpt.exec(
    "select * from imgs where belongId = ?",
    mysqlOpt.formatParams(params.belongId),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  )
};

var setImages = (req, resp) => {
  // var params = qs.parse(req.body);

  getDataUtil.setImg(req, resp);

  // mysqlOpt.exec(
  //   "select * from imgs where belongId = ?",
  //   mysqlOpt.formatParams(params.belongId),
  //   res => {
  //     resp.json(msgResult.msg(res));
  //   },
  //   e => {
  //     console.log(msgResult.error(e.message));
  //   }
  // )
};

module.exports = {
  getImages,
  setImages
};