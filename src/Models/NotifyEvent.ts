import { Notification } from "./Notification";

export type NotifyEvent<T = {}> = {
    id: number;
    notification: Notification;
} & T;