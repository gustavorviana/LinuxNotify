import { DBusCallBack } from './SimpleDBusCallback';
import { Selector } from "./Selector";
import { DBusInterface } from './DBusInterface';
import { DBusObject } from './DBusObject';

export interface SimpleDBusService {
    bus: any;
    getInterface<T = Selector>(objName: string, ifaceName: string, callback: DBusCallBack<DBusInterface & T>): any;
    getObject(name: string, callback: DBusCallBack<DBusObject>): any;

    getInterfaceAsync<T = Selector>(objName: string, ifaceName: string): Promise<DBusInterface & T>;
    getObjectAsync(name: string): Promise<DBusObject>;
}