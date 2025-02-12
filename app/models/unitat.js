const { addCenterFilter, capitalizeFields } = require("../db/middlewares");
const contextPlugin = require("mongoose-request-context");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UnitatSchema = new Schema({
  nom: {
    type: String,
    required: true,
  },
  planta: String,
  zona: String,
  area: String,
  responsable: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  center: {
    type: Schema.Types.ObjectId,
    ref: "Center"
  },
});

// UnitatSchema.pre('save', capitalizeFields(["nom"]))

UnitatSchema.plugin(contextPlugin, {
  contextPath: "request:user.center",
  propertyName: "center",
  contextObjectType: Schema.Types.ObjectId,
});

UnitatSchema.plugin(addCenterFilter)

// Allow same unitat noms only across multiple centers
UnitatSchema.index({ nom: 1, center: 1 }, { unique: true })

module.exports = mongoose.model("Unitat", UnitatSchema);
