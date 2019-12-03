const http = require('http');
const https = require('https');
const iconv = require('iconv-lite');
const mysqlOpt = require('../util/mysqlOpt');
const qs = require('qs');
const msgResult = require('./msgResult');
const util = require('../util/util');

let setNews = (req, resp) => {
  var params = qs.parse(req.body);
  let news = params.news.filter(item => item.url.includes("http"));
  
  let len = news.length - 1;
  let i = 0;

  function save1 () {
    console.log(news[i].docid, news[i].docid.length < 16, !news[i].url.includes("http") && news[i].docid.length < 16 && len > 0)
    if (!news[i].url.includes("http") && news[i].docid.length < 16 && len > 0) {
      len--;
      i++;
      save1();
      // return;
    }

    if (news[i].url.includes("https")) {
      https.get(news[i].url, function(res) {
        res.pipe(iconv.decodeStream('utf8')).collect(function(err, decodedBody) {
          let text = decodedBody.match(/(?<=\<div class="page js-page on"\>)[\W\w]+?(?=<\/article.*>)/);
          console.error(text)
          if (!text) {
            len--;
            i++;
            save1();
            // return;
          } else {
            saveTo(text);
          }
        });
      });
    } else if (news[i].url.includes("http")) {
      http.get(news[i].url, function(res) {
        res.pipe(iconv.decodeStream('utf8')).collect(function(err, decodedBody) {
          let text = decodedBody.match(/(?<=\<div class="page js-page on"\>)[\W\w]+?(?=<\/article.*>)/);
          console.error(text)
          if (!text) {
            len--;
            i++;
            save1();
            // return;
          } else {
           saveTo(text);
          }
          
        });
      });
    }
    function saveTo (text) {
      mysqlOpt.exec(
        `insert into news
          values (?,?,?,?,?)`,
        mysqlOpt.formatParams(null, news[i].title, news[i].docid, news[i].imgsrc, news[i].ptime),
        res => {
          text = text[0].replace(/(<a.*>?)|(\<\/a>?)|(<video[\w\W]*>?\<\/video>)|(精彩弹幕，尽在客户端)|(<span>.*?\<\/span>)|(<span>\w*?)|(<div class\="(otitle_editor|type)">[\w\W]*?<\/div>)|(\&[\w\W]*?;)|data-|\n|\r/g, "");
          save2(text.trim().substring(0, 7000));
        },
        e => {
          console.log(msgResult.error(e.message));
          resp.end()
        }
      )
    }
    
  }
  save1();
  function save2 (text) {
    mysqlOpt.exec(
      `insert into content
        values (?,?,?,?,?,?,?)`,
      mysqlOpt.formatParams(null, news[i].docid, text, 0, news[i].url, null, news[i].ptime),
      res => {
        if (len > 0) {
          len--;
          i++;
          save1();
        } else {
          console.log("ok");
          resp.json(msgResult.msg(res));
        }
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }

}

let setImg = (req, resp) => {
  var params = qs.parse(req.body);

  http.get(params.url, function(res) {
    res.pipe(iconv.decodeStream('utf8')).collect(function(err, decodedBody) {
      let text = decodedBody.match(/(?<=\<ul id="scroll"[\w\W]*>)[\w\W]+?(?=<\/ul.*>)/)[0];
      let urls = text.match(/(?<=data-original=").+?(?=")/g);
      urls.forEach((item, index) => {
        urls[index] = urls[index].replace("_130_170", "");
      });
      let time = decodedBody.match(/(?<=\<span class="time">)[\w\W]+?(?=<\/span>)/)[0];
      let id = util.randomNumber();
      let title = decodedBody.match(/(?<=\<div class="ptitle"><h1>)[\w\W]+?(?=<\/h1>)/)[0];
      let brief = decodedBody.match(/(?<=\<b>简介<\/b>[\s]*<p>)[\w\W]+?(?=<\/p>)/)[0];
      let bid = params.id;
      save({urls, id, time, title, brief, bid});
      // resp.json(msgResult.msg([]));
    });
    
  });

  function save (...params) {
    let {urls, id, time, title, brief, bid} = params[0];
    // resp.json(msgResult.msg([]));
    let len = urls.length - 1;
    let i = 0;
    mysqlOpt.exec(
      `insert into imgs
        values (?,?,?,?,?,?,?)`,
      mysqlOpt.formatParams(null, bid, urls[0], id, title, brief, time),
      res => {
        run();
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
    // run();
    function run () {
      mysqlOpt.exec(
        `insert into imgs
          values (?,?,?,?,?,?,?)`,
        mysqlOpt.formatParams(null, id, urls[i], id, title, brief, time),
        res => {
          if (len > 0) {
            len--;
            i++;
            run();
          } else {
            resp.json(msgResult.msg(res));
          }
          
        },
        e => {
          console.log(msgResult.error(e.message));
          resp.end()
        }
      )
    }
    
  }

  

}

let setGoods = (req, resp) => {
  // var params = qs.parse(req.body);
  // resp.json(msgResult.msg("ok"));
  // http.get(params.url, function(res) {
  //   res.pipe(iconv.decodeStream('utf8')).collect(function(err, decodedBody) {
  //     let text = decodedBody.match(/(?<=\<ul id="scroll"[\w\W]*>)[\w\W]+?(?=<\/ul.*>)/)[0];
      
  //   });
    
  // });

  let a = `<a class="recommend-img-wrapper triggerClick" data-index="0" href="//item.taobao.com/item.htm?id=36012624471&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%2236012624471%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i3/413996455/O1CN010AhNdu1xYRB92DvNb_!!0-item_pic.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="0" href="//item.taobao.com/item.htm?id=36012624471&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%2236012624471%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">创意日式环保原木纸巾架 榉木无漆卷纸收纳架 卫生纸柱厨房纸巾架</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">29.9</span>
    <span class="recommend-payed">77人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="1" href="//item.taobao.com/item.htm?id=37201709325&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%2237201709325%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i2/1939838347/TB26yzqXM1J.eBjy0FaXXaXeVXa_!!1939838347.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="1" href="//item.taobao.com/item.htm?id=37201709325&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%2237201709325%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">日本进口 波佐见烧白山陶器 森正洋 平茶碗 陶瓷饭碗汤碗日式餐具</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">238</span>
    <span class="recommend-payed">11人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="2" href="//item.taobao.com/item.htm?id=521144181859&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22521144181859%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i4/238092107/O1CN01DgtOCQ1RR356q3CIL_!!0-item_pic.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="2" href="//item.taobao.com/item.htm?id=521144181859&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22521144181859%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">6,8,10寸千层蛋糕班戟锅毛巾卷锅电磁炉煤气用不粘平底锅不粘煎锅</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">38.1</span>
    <span class="recommend-payed">15人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="3" href="//item.taobao.com/item.htm?id=521434702832&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22521434702832%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i1/400521425/O1CN012utfQd1MOgxthVOjK_!!400521425.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="3" href="//item.taobao.com/item.htm?id=521434702832&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22521434702832%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">定制餐边柜北欧组合现代简约微波炉柜厨房收纳储物柜置物架茶水柜</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">988</span>
    <span class="recommend-payed">79人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="4" href="//item.taobao.com/item.htm?id=523728727294&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22523728727294%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i1/TB1VbK1KpXXXXXKXpXXXXXXXXXX_!!2-item_pic.png_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="4" href="//item.taobao.com/item.htm?id=523728727294&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22523728727294%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">日本肉球猫爪立体造型陶瓷咖啡勺包邮满减白色到货</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">25</span>
    <span class="recommend-payed">17人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="5" href="//item.taobao.com/item.htm?id=524648112655&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22524648112655%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i4/1705640892/O1CN01B6LQ6N1ISZoxX1lcK_!!0-item_pic.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="5" href="//item.taobao.com/item.htm?id=524648112655&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22524648112655%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">北欧简约胡桃木色门厅柜玄关柜鞋柜组合定做隔断柜镂空屏风鞋柜</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">2,290</span>
    <span class="recommend-payed">73人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="6" href="//item.taobao.com/item.htm?id=528281499958&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22528281499958%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i2/678787205/TB2uzUHeetTMeFjSZFOXXaTiVXa_!!678787205.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="6" href="//item.taobao.com/item.htm?id=528281499958&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22528281499958%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">热卖特价卡通玩偶创意皮质公仔摆件欧式家居饰品生日礼品书档包邮</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">118</span>
    <span class="recommend-payed">10人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="7" href="//item.taobao.com/item.htm?id=531438907266&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22531438907266%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i1/66862613/O1CN01JWDUxs1VAnUm7GeDT_!!66862613-0-pixelsss.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="7" href="//item.taobao.com/item.htm?id=531438907266&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22531438907266%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">天黑黑日系便携自动IT男雨伞长柄自动伞百搭时尚晴雨两用伞女</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">79</span>
    <span class="recommend-payed">12人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="8" href="//item.taobao.com/item.htm?id=533722307193&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22533722307193%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i3/74261787/TB2X9_uqpXXXXcaXXXXXXXXXXXX_!!74261787.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="8" href="//item.taobao.com/item.htm?id=533722307193&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22533722307193%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">Lewu 津轻手工玻璃杯日本进口锤目纹玻璃清酒杯果汁杯水杯饮料杯</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">80</span>
    <span class="recommend-payed">31人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="9" href="//item.taobao.com/item.htm?id=537880597611&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22537880597611%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i3/2867785840/TB1yy5JXgjN8KJjSZFgXXbjbVXa_!!0-item_pic.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="9" href="//item.taobao.com/item.htm?id=537880597611&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22537880597611%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">北欧日式可折叠小户型卧室客厅沙发床可拆洗布艺书房两用实木沙发</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">1,380</span>
    <span class="recommend-payed">18人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="10" href="//item.taobao.com/item.htm?id=538919842098&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22538919842098%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i4/2121631359/O1CN011LuSiq4aAPNas3C_!!2121631359.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="10" href="//item.taobao.com/item.htm?id=538919842098&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22538919842098%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">乐尚多功能碎菜器 家用手动蔬菜绞碎器 蒜肉搅碎机绞肉机饺子馅机</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">45</span>
    <span class="recommend-payed">16人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="11" href="//item.taobao.com/item.htm?id=534326768333&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22534326768333%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i4/48216052/TB2gan2qVXXXXaXXpXXXXXXXXXX_!!48216052.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="11" href="//item.taobao.com/item.htm?id=534326768333&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22534326768333%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">象形design欧式复古做旧陶瓷罗马柱头桌面摆件陶瓷插花花瓶摆件</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">346.5</span>
    <span class="recommend-payed">28人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="12" href="//item.taobao.com/item.htm?id=543695676074&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22543695676074%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i1/120976213/TB2fviDbNlmpuFjSZPfXXc9iXXa_!!120976213.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="12" href="//item.taobao.com/item.htm?id=543695676074&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22543695676074%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">川岛屋 宝宝水果盘子创意可爱早餐盘子宝宝碗卡通米奇碗儿童餐具</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">16</span>
    <span class="recommend-payed">45人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="13" href="//item.taobao.com/item.htm?id=536060024619&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22536060024619%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i4/185473873/TB2sithdNUaBuNjt_iGXXXlkFXa_!!185473873.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="13" href="//item.taobao.com/item.htm?id=536060024619&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22536060024619%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">利物商店 日式超薄玻璃杯 耐热直壁啤酒杯果汁杯水杯（4只装）</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">16</span>
    <span class="recommend-payed">50人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="14" href="//item.taobao.com/item.htm?id=558187174142&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22558187174142%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i3/2451856255/TB2bpjCdE3IL1JjSZFMXXajrFXa_!!2451856255.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="14" href="//item.taobao.com/item.htm?id=558187174142&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22558187174142%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">长方形陶瓷烤碗双耳焗饭盘家用碗芝士意面烘焙烤盘烤箱微波炉专用</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">16.8</span>
    <span class="recommend-payed">95人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="15" href="//item.taobao.com/item.htm?id=561064326259&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22561064326259%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i1/1966860094/O1CN01D2H7Uk1CZ5hxEZol6_!!1966860094.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="15" href="//item.taobao.com/item.htm?id=561064326259&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22561064326259%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">油画文森特梵高星夜星空挂毯装饰毯沙发毯盖毯床毯毛毯针织沙发巾</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">35</span>
    <span class="recommend-payed">132人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="16" href="//item.taobao.com/item.htm?id=550247199933&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22550247199933%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i2/2980193228/TB2EwFaorRkpuFjSspmXXc.9XXa_!!2980193228.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="16" href="//item.taobao.com/item.htm?id=550247199933&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22550247199933%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">AMABRO/日本进口绿色仙人掌/仙人球玻璃摆件/装饰品</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">258</span>
    <span class="recommend-payed">6人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="17" href="//item.taobao.com/item.htm?id=553202722110&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22553202722110%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i3/1054819711/TB2_7YnXRDH8KJjSszcXXbDTFXa_!!1054819711.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="17" href="//item.taobao.com/item.htm?id=553202722110&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22553202722110%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">手工藤编收纳筐竹编中式复古茶道托盘茶点盘客厅茶几零食盒水果篮</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">58</span>
    <span class="recommend-payed">58人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="18" href="//item.taobao.com/item.htm?id=563297731739&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22563297731739%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i1/2452359127/O1CN01jXl9MS2HIDNRq9Zn3_!!0-item_pic.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="18" href="//item.taobao.com/item.htm?id=563297731739&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22563297731739%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">摩登主妇日式厨房金属橱柜分层置物架隔层下挂架家用储物架整理架</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">30</span>
    <span class="recommend-payed">45人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="19" href="//item.taobao.com/item.htm?id=565502102029&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22565502102029%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i2/743520187/O1CN01FcFvB01DFgcfX0CHk_!!0-item_pic.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="19" href="//item.taobao.com/item.htm?id=565502102029&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22565502102029%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">北欧创意时尚风灯金属样板房软装玻璃蜡烛台家居装饰品工艺品摆件</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">98</span>
    <span class="recommend-payed">19人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="20" href="//item.taobao.com/item.htm?id=566870400537&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22566870400537%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i3/2452359127/TB17mBwkruWBuNjSszgXXb8jVXa_!!0-item_pic.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="20" href="//item.taobao.com/item.htm?id=566870400537&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22566870400537%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">摩登主妇家用饺子盒冷冻冰箱保鲜收纳盒冻饺子多层速冻水饺馄饨</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">36</span>
    <span class="recommend-payed">78人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="21" href="//item.taobao.com/item.htm?id=566916890706&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22566916890706%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i4/466434350/TB1kZbKb2ImBKNjSZFlXXc43FXa_!!0-item_pic.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="21" href="//item.taobao.com/item.htm?id=566916890706&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22566916890706%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">烘焙工具 加高4英寸阳极戚风蛋糕模具圆形活底不沾乳酪模具烤箱用</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">14.8</span>
    <span class="recommend-payed">67人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="22" href="//item.taobao.com/item.htm?id=567847350480&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22567847350480%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i3/212961950/TB2l8Gvd4uTBuNkHFNRXXc9qpXa_!!212961950.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="22" href="//item.taobao.com/item.htm?id=567847350480&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22567847350480%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">【推荐】收集时光 立体磨砂玻璃杯水杯果汁杯 包邮 好质感！</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">22.5</span>
    <span class="recommend-payed">86人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="23" href="//item.taobao.com/item.htm?id=568758078761&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22568758078761%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i1/910707850/O1CN01ScIzuN27rLgyJjBGf_!!910707850-0-pixelsss.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="23" href="//item.taobao.com/item.htm?id=568758078761&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22568758078761%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">北欧电视柜茶几组合 黑胡桃色可伸缩电视机柜 现代简约小户型地柜</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">980</span>
    <span class="recommend-payed">343人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="24" href="//item.taobao.com/item.htm?id=569531082908&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22569531082908%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i2/39094259/O1CN01hOGcr31hKfPnjPv6C_!!39094259.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="24" href="//item.taobao.com/item.htm?id=569531082908&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22569531082908%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">日本三明治煎锅煎三明治模具蛋锅早餐锅双面不粘锅烤面包锅慧慧同</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">89</span>
    <span class="recommend-payed">163人已购买</span>
  </div>
</a><a class="recommend-img-wrapper triggerClick" data-index="25" href="//item.taobao.com/item.htm?id=570234141472&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22570234141472%22%7D&amp;spm=a2141.8138988.guess.0">
  <img class="recommend-img lazyload" src="//gw.alicdn.com/bao/uploaded/i1/1051737231/TB2NxbcubSYBuNjSspfXXcZCpXa_!!1051737231.jpg_500x500q90.jpg_.webp">
</a>
<a class="recommend-info triggerClick" data-index="25" href="//item.taobao.com/item.htm?id=570234141472&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22570234141472%22%7D&amp;spm=a2141.8138988.guess.0">
  <div class="recommend-title">
    <span class="recommend-title-p">100个价）彩色条纹抽绳糖果牛轧糖 饼干面包袋 烘焙礼品束口袋</span>
  </div>
  <div class="recommend-price-box">
    <span class="recommend-sign recommend-h">￥</span>
    <span class="recommend-price">49</span>
    <span class="recommend-payed">19人已购买</span>
  </div>
</a>`

  let imgs = a.match(/(?<=\<img class="recommend-img lazyload" src=")[\w\W]+?(?=")/g);
  imgs.forEach((item, index) => imgs[index] = imgs[index].replace(/\/\//, "http://"));
  let titles = a.match(/(?<=\<span class="recommend-title-p">)[\w\W]+?(?=<\/span>)/g);
  let prices = a.match(/(?<=\<span class="recommend-price">)[\w\W]+?(?=<\/span>)/g);
  let oldPrices = [];
  prices.forEach((item, index) => {
    prices[index] = parseFloat(prices[index].replace(",", ""));
    oldPrices.push(parseInt(prices[index] * 0.6 * 100) / 100)
  });

  // console.log(imgs)
  // console.log(titles)
  // console.log(prices)
  let len = imgs.length - 1;
  let i = 0;
  save();
  function save () {
    mysqlOpt.exec(
      `insert into goods
        values (?,?,?,?,?,?,?,?)`,
      mysqlOpt.formatParams(util.randomNumber(), imgs[i], titles[i], prices[i], oldPrices[i], "热卖中", 100, util.randomNumber()),
      res => {
        if (len > 0) {
          len--;
          i++;
          save();
        } else {
          console.log("ok");
          resp.json(msgResult.msg(res));
        }
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }

  

  // resp.json(msgResult.msg("ok"));
}

let goodsDetails = `["http://item.taobao.com/item.htm?id=36012624471&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%2236012624471%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=37201709325&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%2237201709325%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=521144181859&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22521144181859%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=521434702832&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22521434702832%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=523728727294&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22523728727294%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=524648112655&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22524648112655%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=528281499958&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22528281499958%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=531438907266&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22531438907266%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=533722307193&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22533722307193%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=537880597611&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22537880597611%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=538919842098&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22538919842098%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=534326768333&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22534326768333%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=543695676074&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22543695676074%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=536060024619&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22536060024619%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=558187174142&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22558187174142%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=561064326259&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22561064326259%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=550247199933&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22550247199933%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=553202722110&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22553202722110%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=563297731739&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22563297731739%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=565502102029&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22565502102029%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=566870400537&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22566870400537%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=566916890706&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22566916890706%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=567847350480&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22567847350480%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=568758078761&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22568758078761%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=569531082908&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22569531082908%22%7D&amp;spm=a2141.8138988.guess.0","http://item.taobao.com/item.htm?id=570234141472&amp;scm=1007.18975.103645.0&amp;pvid=ba92b609-b478-4631-9069-45855a11afce&amp;utparam=%7B%22ranger_buckets_native%22%3A%22%22%2C%22x_object_type%22%3A%22item%22%2C%22mtx_ab%22%3A1%2C%22mtx_sab%22%3A0%2C%22scm%22%3A%221007.18975.103645.0%22%2C%22x_object_id%22%3A%22570234141472%22%7D&amp;spm=a2141.8138988.guess.0"]`;
goodsDetails = JSON.parse(goodsDetails);

let saveGoodsDetail = (req, resp) => {
  let data = `{"id":"2019120120055810737","content_id":"2019120120055814652","banner":["http://gd2.alicdn.com/imgextra/i1/1051737231/TB2NxbcubSYBuNjSspfXXcZCpXa_!!1051737231.jpg_500x500.jpg","http://gd3.alicdn.com/imgextra/i3/1051737231/TB2sTpEl3KTBuNkSne1XXaJoXXa_!!1051737231.jpg_500x500.jpg","http://gd3.alicdn.com/imgextra/i3/1051737231/TB2y_VmlZuYBuNkSmRyXXcA3pXa_!!1051737231.jpg_500x500.jpg"],"descriptionImgs":["https://img.alicdn.com/imgextra/i3/1051737231/TB2sTpEl3KTBuNkSne1XXaJoXXa_!!1051737231.jpg","https://img.alicdn.com/imgextra/i3/1051737231/TB2y_VmlZuYBuNkSmRyXXcA3pXa_!!1051737231.jpg","https://img.alicdn.com/imgextra/i1/1051737231/TB2CQYks25TBuNjSspmXXaDRVXa_!!1051737231.jpg"]}`
  data = JSON.parse(data);
  let len = data.banner.length - 1;
  let i = 0;
  saveBanner();
  function saveBanner () {
    mysqlOpt.exec(
      `insert into imgs
        values (?,?,?,?,?,?,?)`,
      mysqlOpt.formatParams(null, data.id, data.banner[i], null, null, null, null),
      res => {
        if (len > 0) {
          len--;
          i++;
          saveBanner();
        } else {
          len = data.descriptionImgs.length - 1;
          i = 0;
          saveDescription();
        }
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }

  function saveDescription () {
    mysqlOpt.exec(
      `insert into imgs
        values (?,?,?,?,?,?,?)`,
      mysqlOpt.formatParams(null, data.content_id, data.descriptionImgs[i], null, null, null, null),
      res => {
        if (len > 0) {
          len--;
          i++;
          saveDescription();
        } else {
          resp.json(msgResult.msg(res));
        }
        
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }
}

module.exports = {
  setImg,
  setNews,
  setGoods,
  saveGoodsDetail
};

