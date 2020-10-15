import { DBusCallBack } from './SimpleDBusCallback';
import { Selector } from "./Selector";
import { DBusInterface } from './DBusInterface';

export interface SimpleDBusService {
    bus: any;
    getInterface<T = Selector>(objName: string, ifaceName: string, callback: DBusCallBack<DBusInterface & T>): any;
    getObject<T = any>(name: string, callback: DBusCallBack<T>): any;

    getInterfaceAsync<T = Selector>(objName: string, ifaceName: string): Promise<DBusInterface & T>;
    getObjectAsync<T = any>(name: string): Promise<T>;
}