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
      throw new NotFoundException("Уведомление не найдено!");
    }

    return { deletedNotification };
  }

  public async updateRequestSeenStatus(id: string) {
      const request = await this.notification.findByIdAndUpdate(
        id,
        {
          seen: true,
        },
        { new: true }
      );
  
      if (!request) {
        throw new NotFoundException("Уведомление не найдено!");
      }
  
      return { request };
    }
}

export default NotificationService;
