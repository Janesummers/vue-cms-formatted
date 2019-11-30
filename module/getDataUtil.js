const http = require('http');
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
    if (!news[i].url.includes("http")) {
      len--;
      i++;
      save1();
    }
    mysqlOpt.exec(
      `insert into news
        values (?,?,?,?,?)`,
      mysqlOpt.formatParams(null, news[i].title, news[i].docid, news[i].imgsrc, news[i].ptime),
      res => {
        http.get(news[i].url, function(res) {
          res.pipe(iconv.decodeStream('utf8')).collect(function(err, decodedBody) {
            let text = decodedBody.match(/(?<=\<div class="page js-page on"\>)[\W\w]+?(?=<\/article.*>)/)[0];
            text = text.replace(/(<a.*>?)|(\<\/a>?)|(<video[\w\W]*>?\<\/video>)|(精彩弹幕，尽在客户端)|(<span>.*?\<\/span>)|(<span>\w*?)|(<div class\="(otitle_editor|type)">[\w\W]*?<\/div>)|(\&[\w\W]*?;)|data-|\n|\r/g, "");
            save2(text.trim().substring(0, 7000));
          });
        });
      },
      e => {
        console.log(msgResult.error(e.message));
        resp.end()
      }
    )
  }
  save1();
  function save2 (text) {
    mysqlOpt.exec(
      `insert into content
        values (?,?,?,?,?,?)`,
      mysqlOpt.formatParams(null, news[i].docid, text, 0, news[i].url, null),
      res => {
        if (len > 0) {
          len--;
          i++;
          save1();
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

module.exports = {
  setImg,
  setNews
};

