import { CleanDBusCallBack, DBusCallBack } from "./SimpleDBusCallback";
import { FreedesktopServerInfo } from "./FreedesktopServerInfo";

export interface FreedesktopNotifications {
    Notify(app_name: string, replaces_id: number, app_icon: string, summary: string, body: string, actions: any[], hints: any[], expire_timeout: number, callback: DBusCallBack<number>): void;
    GetCapabilities(callback: DBusCallBack<string[]>): any;
    CloseNotification(id: number, callback: CleanDBusCallBack): number;//Id
    GetServerInformation(name: string, vendor: string, version: string, spec_version: string, callback: DBusCallBack<number>): FreedesktopServerInfo;
}