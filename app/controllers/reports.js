const Departament = require("../models/department")
const Unitat = require("../models/unitat")
const Inventari = require("../models/inventari")

module.exports.index = async (req, res, next) => {
  try {
    const departaments = await Departament.find()
    const unitats = await Unitat.find()
    res.render("reports/index", { departaments, unitats });
  } catch (err) {
    next(err);
  }
};

module.exports.show = async (req, res, next) => {
  try {
    const { departament, unitat } = req.query
    const inventaris = await Inventari.find({ departament, unitat })
    res.render("reports/show", { inventaris });
  } catch (err) {
    next(err);
  }
};
