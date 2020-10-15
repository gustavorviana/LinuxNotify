import { FreedesktopNotifications } from "./DBus/Models/FreedesktopNotifications";
import { DBusInterface } from "./DBus/Models/DBusInterface";
import { ClosedReason } from './Models/ClosedReason'
import { Notification } from "./Models/Notification";
import { NotifyEvent } from "./Models/NotifyEvent";
import { SimpleDBus } from './DBus/SimpleDBus';
import { Button } from "./Models/Button";
import { EventEmitter } from "events";
import os from "os";

const serviceName = 'org.freedesktop.Notifications';
const objName = '/org/freedesktop/Notifications';
const ifaceName = 'org.freedesktop.Notifications';


export declare interface LinuxNotify {
    on(event: "sended", listener: (e: NotifyEvent) => void): this;
    on(event: "closed", listener: (e: NotifyEvent<{ reason: ClosedReason, code: number; }>) => void): this;
    on(event: "action", listener: (e: NotifyEvent<{ button: Button }>) => void): this;
    on(event: "init", listener: () => void): this;
    on(event: "destroy", listener: () => void): this;

    on(event: string | symbol, listener: (...args: any[]) => void): this;
}

/**
 * Object responsible for controlling notifications
 */
export class LinuxNotify extends EventEmitter {

    /**
     * Program name
     */
    public readonly program: string;
    /**
     * Default notification duration
     */
    public duration: number = 5000;
    /**
     * Notification icon (must be the name of the program's executable)
     */
    public desktopEntry: string = null;

    private readonly __dbus = new SimpleDBus()
    private __interface: DBusInterface & FreedesktopNotifications;
    private __listenSystem: boolean;
    private __list: Notification[];

    constructor(program: string, listenSystem?: boolean) {
        super();
        this.program = program;
        this.__listenSystem = !!listenSystem;
        this.onInvoke = this.onInvoke.bind(this);
        this.onClosed = this.onClosed.bind(this);
    }

    /**
     * Starts the notification protocol. (starts automatically when sending a notification)
     */
    public async init() {
        if (this.__interface) throw new Error('The interface has already been initialized!');
        if (os.type() !== 'Linux') throw new Error('Linux only');

        this.__list = [];
        const service = this.__dbus.getService(serviceName);
        this.__interface = await service.getInterfaceAsync<FreedesktopNotifications>(objName, ifaceName);

        this.__interface.on('ActionInvoked', this.onInvoke);
        this.__interface.on('NotificationClosed', this.onClosed);
        this.emit('init');
    }

    /**
     * Destroys communication with the notification system.
     */
    public async destroy() {
        if (this.needInit) throw new Error("It is not possible to destroy an object that has not been started!");

        this.__interface.removeListener('ActionInvoked', this.onInvoke);
        this.__interface.removeListener('NotificationClosed', this.onClosed);

        this.__list = [];
        this.__dbus.endConnection();
        this.emit('destroy');
    }

    /**
     * Signals whether communication with the notification system should be initiated.
     */
    public get needInit() {
        return !this.__interface;
    }

    /**
     * Recovers communication with the notification system
     */
    public get freedesktop() {
        return this.__interface;
    }

    /**
     * Creates a notification
     * @param title Notification title
     */
    public createNotification(summary: string) {
        const notification = new Notification(this);
        notification.summary = summary;
        return notification;
    }

    /**
     * Send a new notification
     * @param summary Notification title
     * @param body Notification body
     * @param duration Duration in milliseconds (not required)
     */
    public sendNotification(summary: string, body: string, duration?: number) {

        const notification = this.createNotification(summary);
        notification.body = body;

        return notification.send(duration);
    }

    /**
     * Retrieves the notification sent by the id. (It will not work with notifications that were sent outside the current process)
     * @param id Notification Id
     */
    public getSended(id: number) {
        if (!id || !Array.isArray(this.__list)) return null;
        return this.__list.find((notify) => notify && notify.id === id);
    }

    /**
     * Indicates whether the object has been destroyed
     */
    public get destroyed() {
        return !this.__dbus.dbusNative.connection.writable;
    }

    /**
     * Removes the notification from the sent list
     * @param id Notification Id
     */
    public removeSended(id: number) {
        if (!id || !Array.isArray(this.__list)) return null;

        const index = this.__list.findIndex((notify) => notify.id === id);;
        if (index < 0) return false;

        this.__list.splice(index);

        return true;
    }

    private onInvoke() {
        const [id, action] = arguments;
        const invoked = this.getSended(id);

        const args = { id } as NotifyEvent & { button: Button };
        args.button = { id: action } as Button;

        if (!invoked && !this.__listenSystem) return;

        if (invoked) {
            args.notification = invoked;

            let btn = invoked.getButton(action);
            if (btn) args.button = btn;

            invoked.emit('action', args);
        }
        this.emit('action', args);
    }

    private onClosed() {
        const [id, code] = arguments;
        const sended = this.getSended(id);

        const event = { id, code } as NotifyEvent & { reason: ClosedReason, code: number };
        event.reason = ClosedReason[code] as any as ClosedReason || ClosedReason.Unknow;

        if (!sended && !this.__listenSystem) return;
        if (sended) {
            event.notification = sended;
            sended.emit('closed', event);
        }

        this.emit('closed', event);
    }

    /**
     * Removes all notifications from the sent list.
     */
    public clearSended() {
        this.__list = [];
    }
}