function renderView(viewName, options) {
  return (req, res, next) => res.render(viewName+'.ejs', options)
}
function renderViewWithError(viewName) {
  return (req, res, next) => res.render(viewName+'.ejs', {
    message: req.flash('error')
  })
}

module.exports = {renderView, renderViewWithError}
