import { NotFoundException } from "../exceptions/notfound.exception";
import { notificationModel } from "./notification.model";

class NotificationService {
  public notification = notificationModel;
  public;

  public async getNotifications() {
    const notifications = await this.notification.find();
    return { notifications };
  }

  public async removeNotification(id: string) {
    const deletedNotification = await this.notification.findByIdAndDelete(id);
    if (!deletedNotification) {
      throw new NotFoundException("Not found notifcation");
    }

    return { deletedNotification };
  }
}

export default NotificationService;
