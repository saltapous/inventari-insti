const Center = require("../models/center");
const User = require("../models/user");
const { generateHash } = require("random-hash");
const { getExpirationTs } = require("../utils/helpers");
const { useNodemailer } = require("../nodemailer/sendEmail");
const { getProtocol } = require("../utils/helpers");
const protocol = getProtocol();

async function createCenter(req, res, next) {
  try {
    const { center: centerName, name, surname, email, password } = req.body;
    const center = await new Center({ name: centerName }).save();
    const user = new User({
      email,
      username: email,
      name,
      surname,
      center: center._id,
      isAdmin: true,
      verificationTs: getExpirationTs(),
      verificationHash: generateHash({ length: 8 }),
    });
    center.users.push(user._id);
    await User.register(user, password);
    const { sendEmail, message } = useNodemailer({
      to: user.email,
      model: "user",
      reason: "verify",
    });
    await sendEmail({
      subject: message.subject,
      text: message.text.replace(
        /{{url}}/,
        `${protocol}://${req.headers.host}/verify?userId=${user.id}&token=${user.verificationHash}`
      ),
    });
    req.flash(
      "info",
      "Tens 10 minuts per activar el teu usuari fent click al link que t'hem enviat per correu."
    );
    res.redirect("/login");
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
}

async function createUser(req, res, next) {
  try {
    const { email, password, centerId } = req.body;
    const user = new User({
      ...req.body,
      username: email,
      center: centerId,
      verificationTs: getExpirationTs(),
      verificationHash: generateHash({ length: 8 }),
    });
    await User.register(user, password);
    const { sendEmail, message } = useNodemailer({
      to: user.email,
      model: "user",
      reason: "verify",
    });
    await sendEmail({
      subject: message.subject,
      text: message.text.replace(
        /{{url}}/,
        `${protocol}://${req.headers.host}/verify?userId=${user.id}&token=${user.verificationHash}`
      ),
    });
    req.flash(
      "info",
      "Avisa a l'usuari, hem enviar un correu amb un link de verificacio que necessiten clicar per activar l'usuari."
    );
    res.redirect("/users");
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/users");
  }
}

async function sendPasswordReset(req, res, next) {
  const { username: email } = req.body;
  // Validate the email and find the user in the database
  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "Aquest usuari no existeix.");
    res.redirect("/account-recovery");
    return;
  }

  // Generate a reset token and store it in the user's document
  const resetPasswordHash = generateHash({ length: 8 });
  user.resetPasswordHash = resetPasswordHash;
  user.resetPasswordTs = Date.now() + 3600000; // Token valid for 1 hour
  await user.save();

  // Send an email to the user with the reset token
  // You can use a library like Nodemailer to send emails
  const { sendEmail, message } = useNodemailer({
    to: user.email,
    model: "user",
    reason: "reset",
  });

  await sendEmail({
    subject: message.subject,
    text: message.text.replace(
      /{{url}}/,
      `${protocol}://${req.headers.host}/reset?userId=${user.id}&token=${resetPasswordHash}`
    ),
  });

  res.redirect("/reset-sent");
}

async function getAllUsers(req, res, next) {
  const users = await User.find({});
  return users;
}

async function getUser(req, res, next) {
  const user = await User.findById(req.params.id);
  const center = await Center.findById(user.center);
  return { user, center };
}

async function updateUser(req, res, next) {
  const { id } = req.params;
  const { isAdmin } = req.body.user;
  const user = await User.findByIdAndUpdate(id, {
    ...req.body.user,
    isAdmin,
  });
  return user;
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    req.flash("success", "Usuari esborrat correctament");
    res.sendStatus(200);
  } catch (error) {
    req.flash("error", "L'usuari no s'ha pogut esborrar");
    res.sendStatus(400);
  }
}

async function verifyUser(req, res, next) {
  const { token, userId } = req.query;
  const user = await User.findById(userId);
  if (!user) {
    req.flash("error", "L'usuari no existeix.");
    res.redirect("/");
  }
  if (!token) {
    req.flash("error", "El token esta buit");
    res.redirect("/");
  }
  const { verificationHash, verificationTs, isVerified } = user;
  if (isVerified) {
    req.flash("error", "L'usuari ja esta verificat.");
    res.redirect("/login");
  }
  const isTokenCorrect = token === verificationHash;
  const isTokenExpired = new Date().getTime() > verificationTs;
  if (!isTokenCorrect) {
    req.flash("error", "El token es invalid o ha expirat");
    res.redirect("/login");
  }
  if (isTokenExpired) {
    const { sendEmail, message } = useNodemailer({
      to: user.email,
      model: "user",
      reason: "verify",
    });
    const newExpirationTs = getExpirationTs(60 * 10 * 1000); // 10mins
    const newHash = generateHash({ length: 8 });
    user.verificationTs = newExpirationTs;
    user.verificationHash = newHash;
    await user.save();
    await sendEmail({
      subject: message.subject,
      text: message.text.replace(
        /{{url}}/,
        `${protocol}://${req.headers.host}/verify?userId=${user.id}&token=${newHash}`
      ),
    });
    req.flash("error", "El token ha expirat - N'hem enviat un de nou.");
    res.redirect("/login");
  }
  if (isTokenCorrect && !isTokenExpired) {
    user.isVerified = true;
    await user.save();
    req.flash("success", "L'usuari ha estat activat correctament");
    res.redirect("/login");
  }
}

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  verifyUser,
  createUser,
  createCenter,
  sendPasswordReset,
};
