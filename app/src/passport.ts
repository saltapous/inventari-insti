import passport from "passport";
import LocalStrategy from "passport-local";
import User from "./models/user";
import Center from "./models/center";

function configurePassport(app) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use(async (req, res, next) => {
    res.locals.center = await Center.findById(req.user?.center).exec();
    res.locals.currentUser = req.user;
    next();
  });
}

export default configurePassport;

