import { DBusInterface } from "./DBusInterface";
import { Selector } from "./Selector";
import { SimpleDBusService } from "./SimpleDBusService";

export interface DBusObject {
    as(name: string): DBusInterface;
    name: string;
    nodes: [];
    proxy: Selector;
    service: SimpleDBusService;
}