const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "static")));

/**
 * 全系统允许跨域处理 这段配置要再new出express实例的时候就要设置了
 */
app.all("*",function(req,res,next){
  //设置允许跨域的域名，*代表允许任意域名跨域
  res.header("Access-Control-Allow-Origin","*");
  //允许的header类型
  res.header("Access-Control-Allow-Headers","*");
  //跨域允许的请求方式
  res.header("Access-Control-Allow-Methods","*");
  if (req.method.toLowerCase() === 'options')
    res.send(200);  //让options尝试请求快速结束
  else
    next();
});

// 用户路由
const user = require('./user');
/**
 * 登录
 */
app.post("/login", (req, resp) => {
  user.login(req, resp);
});

// 注册
app.post("/regist", (req, resp) => {
  user.register(req, resp);
});

// 获取图片
const images = require('./imgs');
app.post("/getImgs", (req, resp) => {
  images.getImages(req, resp);
});

app.post("/setImgs", (req, resp) => {
  images.setImages(req, resp);
});

// 获取新闻
const news = require('./news');
app.post('/getNewsByPage', (req, resp) => {
  news.getList(req, resp);
});

app.post('/saveNews', (req, resp) => {
  news.saveNewList(req, resp);
});

// 
app.post('/getImgContentById', (req, resp) => {
  news.getNewsInfo(req, resp);
});

app.post('/updateImgContentHitsById', (req, resp) => {
  news.updateHits(req, resp);
});

const pictureShare = require('./pictureShare');
app.post('/getImgNavigate', (req, resp) => {
  pictureShare.getNavigate(req, resp);
});


const goods = require('./goods');
app.post('/getGoods', (req, resp) => {
  goods.getGoods(req, resp)
});

app.post("/getMyGoods", (req, resp) => {
  goods.getMyGoods(req, resp);
});

app.post('/addToCar', (req, resp) => {
  goods.addToCar(req, resp);
});

app.post('/updateForCar', (req, resp) => {
  goods.updateCard(req, resp);
});

app.post('/deleteMyGoodsById', (req, resp) => {
  goods.delMyGoods(req, resp);
});

app.post('/payForGoods', (req, resp) => {
  goods.payForGoods(req, resp);
});


const comments = require('./comment');
app.post('/getCommentByPage', (req, resp) => {
  comments.getComments(req, resp);
});

app.post('/addComment', (req, resp) => {
  comments.addComment(req, resp);
});



app.listen(8080, () => {
  console.log("开启成功：http://localhost:8080");
});