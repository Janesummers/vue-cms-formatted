const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');
const getDataUtil = require('./getDataUtil');
const util = require('../util/util');

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
  // getDataUtil.setGoods(req, resp);
  var params = qs.parse(req.body);
  if (!params || !params.price || !params.img || !params.title || !params.oldPrice || !params.left_count) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let price = parseFloat(params.price);
  let oldPrice = parseFloat(params.oldPrice);
  let bannerImg = params.bannerImg;
  let detailImg = params.detailImg;
  let len = bannerImg.length - 1;
  let i = 0;
  let id = util.randomNumber();
  let content_id = util.randomNumber();
  mysqlOpt.exec(
    `insert into goods
      values (?,?,?,?,?,?,?,?)`,
    mysqlOpt.formatParams(id, params.img, params.title, price, oldPrice, '热卖中', params.left_count, content_id),
    res => {
      saveBannerImg();
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )

  function saveBannerImg () {
    mysqlOpt.exec(
      `insert into imgs
        values (?,?,?,?,?,?,?)`,
      mysqlOpt.formatParams(null, id, bannerImg[i], null, null, null, null),
      res => {
        if (len > 0) {
          len--;
          i++;
          saveBannerImg();
        } else {
          len = detailImg.length - 1;
          i = 0;
          saveDetailImg();
        }
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }

  function saveDetailImg () {
    mysqlOpt.exec(
      `insert into imgs
        values (?,?,?,?,?,?,?)`,
      mysqlOpt.formatParams(null, content_id, detailImg[i], null, null, null, null),
      res => {
        if (len > 0) {
          len--;
          i++;
          saveDetailImg();
        } else {
          resp.json(msgResult.msg("ok"));
        }
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }
}

var alterGoods = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.price || !params.img || !params.title || !params.oldPrice || !params.left_count) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  let price = parseFloat(params.price);
  let oldPrice = parseFloat(params.oldPrice);
  
  let {bannerChange,
    detailChange,
    newBanner,
    newDetail,
    bannerDel,
    detailDel} = params;
  let len = 0;
  let i = 0;
  let id = params.id;
  let content_id = params.content_id;

  mysqlOpt.exec(
    `
      update goods
      set img = ?,name = ?,new_price = ?,old_price = ?,left_count = ?
      where id = ?
    `,
    mysqlOpt.formatParams(params.img, params.title, price, oldPrice, params.left_count, id),
    () => {
      if (bannerChange) {
        len = bannerChange.length > 1 ? bannerChange.length - 1 : bannerChange.length;
        i = 0;
        updateBanner('no');
      } else {
        updateBanner('yes');
      }
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )

  function updateBanner (skip) {
    if (skip == 'no' && len > 0) {
      mysqlOpt.exec(
        `update imgs
          set src = ?
          where id = ?`,
        mysqlOpt.formatParams(bannerChange[i].src, bannerChange[i].id),
        () => {
          len--;
          i++;
          updateBanner(skip);
        },
        e => {
          console.log(msgResult.error(e.message));
          resp.end()
        }
      )
    } else {
      if (detailChange) {
        len = detailChange.length > 1 ? detailChange.length - 1 : detailChange.length;
        i = 0;
        updateDetail('no');
      } else {
        updateDetail('yes');
      }
    }
  }

  function updateDetail (skip) {
    if (skip == 'no' && len > 0) {
      mysqlOpt.exec(
        `update imgs
          set src = ?
          where id = ?`,
        mysqlOpt.formatParams(detailChange[i].src, detailChange[i].id),
        () => {
          len--;
          i++;
          updateDetail(skip);
        },
        e => {
          console.log(msgResult.error(e.message));
          resp.end()
        }
      )
    } else {
      if (bannerDel) {
        len = bannerDel.length > 1 ? bannerDel.length - 1 : bannerDel.length;
        i = 0;
        delBannerImg('no');
      } else {
        delBannerImg('yes');
      }
    }
  }

  function delBannerImg (skip) {
    if (skip == 'no' && len > 0) {
      mysqlOpt.exec(
        `delete from imgs
          where id = ?`,
        mysqlOpt.formatParams(bannerDel[i].id),
        () => {
          len--;
          i++;
          delBannerImg(skip);
        },
        e => {
          console.log(msgResult.error(e.message));
          resp.end()
        }
      )
    } else {
      if (detailDel) {
        len = detailDel.length > 1 ? detailDel.length - 1 : detailDel.length;
        i = 0;
        delDetailImg('no');
      } else {
        delDetailImg('yes');
      }
    }
  }

  function delDetailImg (skip) {
    if (skip == 'no' && len > 0) {
      mysqlOpt.exec(
        `delete from imgs
          where id = ?`,
        mysqlOpt.formatParams(detailDel[i].id),
        () => {
          len--;
          i++;
          delDetailImg(skip);
        },
        e => {
          console.log(msgResult.error(e.message));
          resp.end()
        }
      )
    } else {
      if (newBanner) {
        len = newBanner.length > 1 ? newBanner.length - 1 : newBanner.length;
        i = 0;
        saveBannerImg('no');
      } else {
        saveBannerImg('yes');
      }
    }
  }

  function saveBannerImg (skip) {
    if (skip && len > 0) {
      mysqlOpt.exec(
        `insert into imgs
          values (?,?,?,?,?,?,?)`,
        mysqlOpt.formatParams(null, id, newBanner[i].src, null, null, null, null),
        () => {
          console.log('ready to 5 -> next')
          len--;
          i++;
          saveBannerImg();
        },
        e => {
          console.log(msgResult.error(e.message));
          resp.end()
        }
      )
    } else {
      if (newDetail) {
        len = newDetail.length > 1 ? newDetail.length - 1 : newDetail.length;
        i = 0;
        saveDetailImg('no');
      } else {
        saveDetailImg('yes');
      }
    }
  }

  function saveDetailImg (skip) {
    if (skip == 'no' && len > 0) {
      mysqlOpt.exec(
        `insert into imgs
         values (?,?,?,?,?,?,?)`,
        mysqlOpt.formatParams(null, content_id, newDetail[i].src, null, null, null, null),
        () => {
          len--;
          i++;
          saveDetailImg(skip);
        },
        e => {
          console.log(msgResult.error(e.message));
          resp.end()
        }
      )
    } else {
      resp.json(msgResult.msg("ok"));
    }
  }

}

var delGoods = (req, resp) => {
  // getDataUtil.setGoods(req, resp);
  var params = qs.parse(req.body);
  if (!params || !params.id || !params.contentId || params.id.length != 19 || params.contentId.length != 19) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  
  mysqlOpt.exec(
    `
      delete 
      from goods
      where id = ?
    `,
    mysqlOpt.formatParams(params.id),
    res => {
      delImg();
    },
    e => {
      console.log(msgResult.error(e.message));
      resp.end()
    }
  )
  
  function delImg () {
    mysqlOpt.exec(
      `
        delete 
        from imgs
        where belongId in (?,?)
      `,
      mysqlOpt.formatParams(params.id, params.contentId),
      res => {
        delComment();
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }

  function delComment () {
    mysqlOpt.exec(
      `
        delete 
        from comments
        where belongId = ?
      `,
      mysqlOpt.formatParams(params.id),
      res => {
        resp.json(msgResult.msg("ok"));
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }

}



// var saveGoodsDetail = (req, resp) => {
//   getDataUtil.saveGoodsDetail(req, resp);
// }

var getMyGoods = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `select a.order_id, a.pay_money, a.time, b.id, b.goods_name as name, b.goods_price as price, b.goods_count as count, c.img 
     from orders a, goodsOrder b, goods c 
     where a.order_id = b.order_id and b.goods_id = c.id and a.belongId = ?`,
    mysqlOpt.formatParams(params.belongId),
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

let getMyShopCart = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || !params.belongId || params.belongId.length !== 19) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `
      select a.id, a.count, a.goods_id, b.img, b.name as title, b.new_price as price
      from card a, goods b
      where a.belongId = ? and b.id = a.goods_id
    `,
    mysqlOpt.formatParams(params.belongId),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  )
}

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
  let order_id = util.randomNumber();
  let time = util.getTime();
  let allPrice = parseFloat(params.allPrice);
  let addOrder = () => {
    mysqlOpt.exec(
      `
        insert into orders
        values(?,?,?,?,?)
      `,
      mysqlOpt.formatParams(
        null, 
        order_id, 
        allPrice,
        params.belongId,
        time
      ),
      res => {
        resp.json("ok");
      },
      e => {
        console.log(msgResult.error(e.message));
      }
    )
  }
  function pay(i) {
    if (i >= 0) {
      mysqlOpt.exec(
        `
          update card c, goods g
          set g.left_count = g.left_count - c.count
          where c.belongId = ? and c.id = ? and c.goods_id = g.id
        `,
        mysqlOpt.formatParams(params.belongId, params.list[i].id),
        res => {
          delShopCard();
        },
        e => {
          console.log(msgResult.error(e.message));
        }
      )
      let delShopCard = () => {
        mysqlOpt.exec(
          `
            delete 
            from card
            where id = ? and belongId = ?
          `,
          mysqlOpt.formatParams(params.list[i].id, params.belongId),
          res => {
            addGoodsOrder();
          },
          e => {
            console.log(msgResult.error(e.message));
          }
        )
      }
      let addGoodsOrder = () => {
        let price = parseFloat(params.list[i].price);
        let count = parseInt(params.list[i].count);
        mysqlOpt.exec(
          `
            insert into goodsOrder
            values(?,?,?,?,?,?)
          `,
          mysqlOpt.formatParams(
            null,
            order_id,
            params.list[i].title,
            price, 
            count,
            params.list[i].goods_id
          ),
          res => {
            i--;
            pay(i);
          },
          e => {
            console.log(msgResult.error(e.message));
          }
        )
      }
    } else {
      addOrder();
    }
  }
  pay(params.list.length - 1)

};

let clearAllMyGoods = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || params.belongId.length !== 19 || !params.list) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  function clear(i, callback) {
    if (i >= 0) {
      mysqlOpt.exec(
      `
        delete
        from card
        where belongId = ?
      `,
        mysqlOpt.formatParams(params.belongId),
        res => {
          i--;
          clear(i, callback);
        },
        e => {
          console.log(msgResult.error(e.message));
        }
      )
    } else {
      callback && callback();
    }
  }
  clear(params.list.length - 1, () => {
    resp.json("ok");
  })
}

let getOnceGoods = (req, resp) => {
  var params = qs.parse(req.body);
  if (!params || params.id.length !== 19) {
    resp.json(msgResult.error("参数不合法"));
    return;
  }
  mysqlOpt.exec(
    `
      select * from goods where id = ?
    `,
    mysqlOpt.formatParams(params.id),
    res => {
      resp.json(msgResult.msg(res));
    },
    e => {
      console.log(msgResult.error(e.message));
    }
  )
}


module.exports = {
  getGoods,
  getMyGoods,
  getMyShopCart,
  addToCar,
  updateCard,
  delMyGoods,
  payForGoods,
  setGoods,
  // saveGoodsDetail,
  clearAllMyGoods,
  delGoods,
  getOnceGoods,
  alterGoods
};