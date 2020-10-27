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
        this.__interface = await this.__dbus.getInterface(serviceName, objName, ifaceName);

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
     * It returns an array of strings. Each string describes an optional capability implemented by the server.
     */
    public async getCapabilities() {
        if (this.needInit) {
            await this.init()
        }

        return await new Promise<string[]>((resolve, reject) => {
            this.freedesktop.GetCapabilities((error, results) => {
                if (error) {
                    reject(error)
                    return;
                }

                resolve(results)
            });
        })
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

    private onInvoke(id: number, action: string) {
        if (!this.canDispatch(id)) return;

        const args = this.eventArgsById<{ button: Button }>(id);

        if (args.notification && args.notification.hasButton(action)) {
            args.button = args.notification.getButton(action);
        } else {
            args.button = { id: action } as Button;
        }

        this.dispatchEvent('action', args)
    }

    private onClosed(id: number, code: number) {
        if (!this.canDispatch(id)) return;

        const args = this.eventArgsById<{ reason: ClosedReason, code: number }>(id);
        
        args.reason = ClosedReason[code] as any as ClosedReason || ClosedReason.Unknow;
        args.code = code;

        this.dispatchEvent('closed', args)
    }

    protected dispatchEvent(name: string, args: NotifyEvent) {
        if (!args.notification && !this.__listenSystem) return;

        this.emit(name, args);
        if (args.notification) {
            args.notification.emit(name, args);
        }
    }

    protected eventArgsById<T>(id: number) {
        const args = {
            id,
            notification: this.getSended(id)
        } as T & NotifyEvent

        return args;
    }

    protected canDispatch(notifyId: number) {
        return notifyId && (this.getSended(notifyId) || this.__listenSystem)
    }

    /**
     * Removes all notifications from the sent list.
     */
    public clearSended() {
        this.__list = [];
    }
}