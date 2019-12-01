const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');
const getDataUtil = require('./getDataUtil');
var getGoods = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let pageNo = params.pageNo ? parseInt(params.pageNo) : 1;
  let pageSize = params.pageSize ? parseInt(params.pageSize) : 10;
  mysqlOpt.exec(
    "select * from goods limit ?,?",
    mysqlOpt.formatParams((pageNo - 1) * pageSize, pageSize),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  )
};

var setGoods = (req, resp) => {
  getDataUtil.setGoods(req, resp);
}

var getMyGoods = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19 || !params.status) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `select a.*, b.left_count, b.img, b.name as title, b.new_price as price 
     from card a, goods b 
     where a.goods_id = b.id and a.status = ? and a.belongId = ?`,
    mysqlOpt.formatParams(params.status, params.belongId),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  )
};

var addToCar = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19 || !params.goodsId || !params.count) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `
      insert into card (count,belongId,goods_id)
      values (?,?,?)
    `,
    mysqlOpt.formatParams(params.count, params.belongId, params.goodsId),
    res => {
      resp.json(msgResult.msg(1));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  );
};

var updateCard =  (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19 || !params.id || !params.count) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `
      update card
      set count = ?
      where id = ? and belongId = ?
    `,
    mysqlOpt.formatParams(params.count, params.id, params.belongId),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  )
};

var delMyGoods = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19 || !params.id) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `
      delete 
      from card
      where id = ? and belongId = ?
    `,
    mysqlOpt.formatParams(params.id, params.belongId),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  )
};

var payForGoods = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19 || !params.list) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  // console.log(params.list[0]);
  function pay(i, callback) {
    if (i >= 0) {
      mysqlOpt.exec(
        `
      update card
      set status = 1
      where id = ? and belongId = ?
    `,
        mysqlOpt.formatParams(params.list[i].id, params.belongId),
        res => {
          i--;
          pay(i, callback);
        },
        e => {
          console.log(msgResult.error(e.message));
        }
      )
    } else {
      callback && callback();
    }
  }
  pay(params.list.length - 1, () => {
    resp.json("ok");
  })

};


module.exports = {
  getGoods,
  getMyGoods,
  addToCar,
  updateCard,
  delMyGoods,
  payForGoods,
  setGoods
};