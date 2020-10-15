export type DBusCallBack<T> = (errors: string[], result: T) => void;

export type CleanDBusCallBack = (errors: string[]) => void;