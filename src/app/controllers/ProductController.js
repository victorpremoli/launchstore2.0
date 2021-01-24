const {formatPrice, date} = require("../../lib/utils")

const Category = require("../models/Category")
const Product = require("../models/Product")
const File = require("../models/File")

module.exports = {
    create(req,res) {
        //Pegar categorias
        Category.all()
        .then(function(results) {
            const categories = results.rows
            return res.render('products/create.njk', {categories})
        }).catch(function(err){
            throw new Error(err)
        })
    },
    async post(req,res) {
        //Lógica de salvar
        const keys = Object.keys(req.body)

        for (const key of keys) {
            if(req.body[key] == "") {
                return res.send("please fill all fildes!")
            }
        }

        if(req.files.length == 0)
            return res.send("please, send at least one image")
        
        req.body.user_id = req.session.userId
        let results = await Product.create(req.body)
        const productId = results.rows[0].id

        const filesPromice = req.files.map(file => File.create({...file, product_id : productId}))
        await Promise.all(filesPromice)

        return res.redirect(`/products/${productId}/edit`)

    },
    async show (req,res) {

        let results = await Product.find(req.params.id)
        const product = results.rows[0]

        if(!product) return res.send("Product not found")

        const {day, month , hour , minutes} = date(product.updated_at)

        product.published = {
            day: `${day}/${month}`,
            hour: `${hour}h${minutes}`,
        }

        product.oldPrice = formatPrice(product.old_price)
        product.price = formatPrice(product.price)

        results = await Product.files(product.id)
        const files = results.rows.map(file => ({
            ...file,
            src:`${req.protocol}://${req.headers.host}${file.path.replace("public", "")}`
        }))

        return res.render("products/show", {product, files})
    },
    async edit (req, res) {
        let results = await Product.find(req.params.id)
        const product = results.rows[0]

        if(!product) return res.send("product not found!")

        product.old_price = formatPrice(product.old_price)
        product.price = formatPrice(product.price)

        //get categories
        results = await Category.all()
        const categories = results.rows

        //get images
        results = await Product.files(product.id)
        let files = results.rows
        files = files.map(file => ({
            ...file,
            src:`${req.protocol}://${req.headers.host}${file.path.replace("public", "")}`
        }))
        return res.render("products/edit.njk", { product, categories, files })
    },
    async put (req,res) {

        const keys = Object.keys(req.body)

        for (const key of keys) {
            if(req.body[key] == "" && key != "removed_files" && key != "photos") {
                return res.send(`please fill all fildes! ${key}`)
            }
        }
        
        if(req.body.removed_files) {
            const removedFiles = req.body.removed_files.split(",")
            const lastIndex = removedFiles.length - 1
            removedFiles.splice(lastIndex, 1)

            const removedFilesPromise = removedFiles.map(id => File.delete(id))

            await Promise.all(removedFilesPromise)
        }

        if(req.files.length != 0) {

            //validar quantidade de imagens no banco
            const oldFiles = await Product.files(req.body.id)
            const totalFiles = oldFiles.rows.length + req.files.length

            if (totalFiles <= 6) {
                const newFilesPromise = req.files.map(file => 
                    File.create({...file, product_id: req.body.id}))
                
                await Promise.all(newFilesPromise)
            }

        }

        req.body.price = req.body.price.replace(/\D/g,"")

        if (req.body.price != req.body.old_price) {
            const oldProduct = await Product.find(req.body.id)

            req.body.old_price = oldProduct.rows[0].price
        }

        await Product.update(req.body)

        return res.redirect(`/products/${req.body.id}`)

    },
    async delete(req,res) {
        await Product.delete(req.body.id)
        
        return res.redirect('/products/create')
    }
}