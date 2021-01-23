const nodemailer = require("nodemailer")

module.exports = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "358d6da31d03e1",
      pass: "5058f80934c8c6"
    }
});