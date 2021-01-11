class UserController {
    registerForm(req,res) {
        return res.redirect('/produtos')
    }
}

module.exports = new UserController()