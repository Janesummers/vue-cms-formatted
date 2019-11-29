var error = data => {
  return {
    code: "error",
    data
  }
};

var msg = data => {
  return {
    code: "ok",
    data
  }
};

module.exports = {
  error,
  msg
}