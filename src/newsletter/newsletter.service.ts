import { newsletterModel } from "./newsletter.module";
import { UserWithThatEmailAlreadyExistsException } from "../exceptions/userWithThatEmailAlreadyExists.exception";
import { INewsletter } from "./newsletter.interface";

class NewsletterService {
  public newsletter = newsletterModel;
  public;

  public async postNewsletterEmail(newsletterData: INewsletter) {
    const checkNewsletterEmail = await this.newsletter.findOne({
      email: newsletterData.email,
    });
    if (checkNewsletterEmail) {
      throw new UserWithThatEmailAlreadyExistsException(newsletterData.email);
    }

    const newNewsletter = new this.newsletter(newsletterData);
    await newNewsletter.save();

    return { newNewsletter };
  }
}

export default NewsletterService;
