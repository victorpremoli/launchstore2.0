const crypto = require('crypto')
const mailer = require('../../lib/mailer')
const User = require('../models/User')
const {hash} = require('bcryptjs')

module.exports = {
    logout(req,res) {
        req.session.destroy()
        return res.redirect("/")
    },
    loginForm(req,res) {
        return res.render("session/login")
    },
    login(req, res) {
        req.session.userId = req.user.id

        return res.redirect("/users")
    },
    forgotForm(req,res) {
        req.session.destroy()
        return res.render("session/forgot-password")
    },
     async forgot(req,res) {
        const user = req.user

        try {
            const token = crypto.randomBytes(20).toString("hex")

            let now = new Date()
            now = now.setHours(now.getHours() + 1)

            await User.update(user.id, {
                reset_token: token,
                reset_token_expires: now
            })

            await mailer.sendMail({
                to: user.email,
                from: 'no-reply@launchstore.com.br',
                subject: 'Recuperação de senha',
                html: `
                <h2>Perdeu a chave?</h2>
                <p>Não se preocupe, clique no link abaixo para cadastrar uma nova senha.</p>
                <p>
                    <a href="http://localhost:3000/users/password-reset?token=${token}" target="_blank">
                        Cadastrar nova senha
                    </a>
                </p>
                `,
            })

            return res.render("session/forgot-password", {
                success: `Email de recuperação enviado para ${user.email}`
            })

        } catch (error) {
            console.error(error)
            return res.render("session/forgot-password", {
                error: "Erro inesperado, tente novamente mais tarde!"
            })
        }        
    },
    resetForm(req,res) {
        return res.render("session/password-reset", { token: req.query.token })
    },
    async reset(req,res) {
        const user = req.user
        const { password, token } = req.body

        try {
            //create new hash password
            const newPassword = await hash(password, 8)

            //update user
            await User.update(user.id, {
                password: newPassword,
                reset_token: "",
                reset_token_expires: "",
            } )

            //send mensseger to user
            return res.render("session/login", {
                user: req.body,
                success: "Senha atualizada com sucesso, faça seu login."
            })


            
        } catch (error) {
            console.error(error)
            return res.render("session/password-reset", {
                user: req.body,
                token,
                error: "Erro inesperado, tente novamente!"
            })
        }

    }
}