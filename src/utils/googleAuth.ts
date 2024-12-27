import * as passport from "passport";
import { IUser } from "../user/user.interface";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import AuthenticationService from "../authentication/authentication.service";

class GoogleAuth {
  public authenticationService = new AuthenticationService();

  constructor() {
    this.initializeGoogleStrategy();
    this.setupSerializeUser();
    this.setupDeserializeUser();
  }

  private initializeGoogleStrategy() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        this.verifyCallback
      )
    );
  }

  private verifyCallback = async (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: IUser | false | null) => void
  ) => {
    try {
      const { user } = await this.authenticationService.loginWithGoogle(
        profile
      );
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  };

  private setupSerializeUser() {
    passport.serializeUser(
      (user: IUser, done: (err: any, user?: IUser) => void) => {
        done(null, user);
      }
    );
  }

  private setupDeserializeUser() {
    passport.deserializeUser(
      async (user, done: (err: any, user?: IUser | null) => void) => {
        done(null, user);
      }
    );
  }

  public initialize() {
    return passport.initialize();
  }

  public session() {
    return passport.session();
  }

  public authenticate(scope: string[]) {
    return passport.authenticate("google", { scope });
  }

  public callbackAuth() {
    return passport.authenticate("google", { failureRedirect: `${process.env.APP_URL}/auth/failed` })
  }
}

export default new GoogleAuth();