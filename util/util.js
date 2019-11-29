function randomNumber() {
  let d = new Date();
  return `${d.getFullYear()}${d.getMonth() + 1 <= 9 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1}${d.getDate() <= 9 ? '0' + d.getDate() : d.getDate()}${d.getHours() <= 9 ? '0' + d.getHours() : d.getHours()}${d.getMinutes() <= 9 ? '0' + d.getMinutes() : d.getMinutes()}${d.getSeconds() <= 9 ? '0' + d.getSeconds() : d.getSeconds()}${Math.floor((Math.random() + 1) * 10000)}`;
}

module.exports = {
  randomNumber
};