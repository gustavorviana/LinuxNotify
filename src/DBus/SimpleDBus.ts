import dbus from 'dbus-native';
import { DBusInterface } from './Models/DBusInterface';
import { Selector } from './Models/Selector';
import { SimpleDBusService } from './Models/SimpleDBusService';

export class SimpleDBus {

    private __dbus: any;

    constructor() {
        this.__dbus = dbus.sessionBus();
    }

    public get dbusNative() {
        return this.__dbus;
    }

    public endConnection() {
        this.__dbus.connection.end();
    }

    public getService(name: string) {
        const service = this.__dbus.getService(name) as SimpleDBusService;
        if (!service) return null;

        service.getInterfaceAsync = function <T = Selector>(objName: string, ifaceName: string) {
            return new Promise<DBusInterface & T>((resolve, reject) => {
                service.getInterface<T>(objName, ifaceName, (errors, result) => {
                    if (errors) {
                        reject(errors);
                        return;
                    }

                    resolve(result);
                })
            });
        };

        service.getObjectAsync = function (name: string) {
            return new Promise((resolve, reject) => {
                service.getObject(name, (errors, result) => {
                    if (errors) {
                        reject(errors);
                        return;
                    }

                    resolve(result);
                });
            });
        };

        return service;
    }

    public getObject(path: string, name: string) {
        const service = this.getService(path);

        return service.getObjectAsync(name)
    }

    public getInterface<T = Selector>(path: string, objName: string, name: string) {
        const service = this.getService(path);

        return service.getInterfaceAsync<T>(objName, name)
    }
}