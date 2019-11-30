const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');
const getDataUtil = require('./getDataUtil');

var getList = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let pageNo = params.pageNo ? parseInt(params.pageNo) : 1;
  let pageSize = params.pageSize ? parseInt(params.pageSize) : 3;
  mysqlOpt.exec(
    `select a.title, a.id, a.content_id, a.img, a.time, b.hits, b.url
     from news a, content b
     where a.content_id = b.content_id
     order by a.time desc
     limit ?,?`,
    mysqlOpt.formatParams((pageNo - 1) * pageSize, pageSize),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )
};

var getNewsInfo = (req, resp) => {
  var params = qs.parse(req.body);
  // if (!params || !params.id || params.id.length !== 19) {
  //   resp.json(msgResult.error("参数不合法"));
  //   return;
  // }
  if (!params || !params.id || (params.id.length !== 16 && params.id.length !== 19)) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `select a.time, b.hits, b.content, b.content2, a.title 
     from news a, content b
     where b.content_id = ? && a.content_id = b.content_id`,
    mysqlOpt.formatParams(params.id),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )
};

let saveNewList = (req, resp) => {
  getDataUtil.setNews(req, resp);
}

var updateHits = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.id || (params.id.length !== 16 && params.id.length !== 19)) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `update content
     set hits = hits + 1
     where content_id = ?`,
    mysqlOpt.formatParams(params.id),
    res => {
      getHits(params.id, resp)
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )
};

var getHits = (id, resp) => {
  mysqlOpt.exec(
    `select hits from content
     where content_id = ?`,
    mysqlOpt.formatParams(id),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )
}

module.exports = {
  getList,
  getNewsInfo,
  updateHits,
  saveNewList
};