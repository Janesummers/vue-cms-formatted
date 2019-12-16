const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');
const getDataUtil = require('./getDataUtil');

let getMovie = (req, resp) => {
  // getDataUtil.getMovie(req, resp);
  var params = qs.parse(req.body);
  if (!params) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let pageNo = params.pageNo ? parseInt(params.pageNo) : 1;
  let pageSize = params.pageSize ? parseInt(params.pageSize) : 3;
  mysqlOpt.exec(
    `select * from movie limit ?,?`,
    mysqlOpt.formatParams((pageNo - 1) * pageSize, pageSize),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )
}

let getMovieInfo = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length < 19) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let data = {};
  getCasts();
  function getCasts () {
    mysqlOpt.exec(
      `select * from movieCasts where belongId = ?`,
      mysqlOpt.formatParams(params.belongId),
      res => {
        data.casts = res;
        getInfo();
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }

  function getInfo () {
    mysqlOpt.exec(
      `select * from movieInfo where belongId = ?`,
      mysqlOpt.formatParams(params.belongId),
      res => {
        data.info = res[0];
        resp.json(msgResult.msg(data));
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }

  



  


}

// let saveMovie = (req, resp) => {
//   getDataUtil.saveMovie(req, resp);
// }



module.exports = {
  getMovie,
  // saveMovie,
  getMovieInfo
}