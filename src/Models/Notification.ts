import { ClosedReason } from "./ClosedReason";
import { LinuxNotify } from "../LinuxNotify";
import { NotifyEvent } from "./NotifyEvent";
import { EventEmitter } from "events";
import { Button } from "./Button";
import { Hint } from "./Hint";
import { HintType } from "./HintType";

export declare interface Notification {
    on(event: "sended", listener: (e: NotifyEvent) => void): this;
    on(event: "closed", listener: (e: NotifyEvent<{ reason: ClosedReason, code: number }>) => void): this;
    on(event: "action", listener: (e: NotifyEvent<{ button: Button }>) => void): this;

    on(event: string | symbol, listener: (...args: any[]) => void): this;
}


const hintData = {
    'action-icons': HintType.boolean,
    'category': HintType.string,
    'desktop-entry': HintType.string,
    'image-path': HintType.string,
    'image_path': HintType.string,
    'resident': HintType.boolean,
    'sound-file': HintType.string,
    'sound-name': HintType.string,
    'suppress-sound': HintType.boolean,
    'transient': HintType.boolean
};

export declare interface Notification {
    setHint(name: 'action-icons', value: boolean): void;
    setHint(name: 'category', value: string): void;
    setHint(name: 'desktop-entry', value: string): void;
    setHint(name: 'image-data', value: any, type: HintType): void;
    setHint(name: 'image_data', value: any, type: HintType): void;
    setHint(name: 'image-path', value: string): void;
    setHint(name: 'image_path', value: string): void;
    setHint(name: 'resident', value: boolean): void;
    setHint(name: 'sound-file', value: string): void;
    setHint(name: 'sound-name', value: string): void;
    setHint(name: 'suppress-sound', value: boolean): void;
    setHint(name: 'transient', value: boolean): void;
    setHint(name: 'x', value: number): void;
    setHint(name: 'y', value: number): void;
    setHint(name: 'urgency', value: number): void;
    setHint(name: string, value: any, type: HintType): void;

    hasHint(name: 'action-icons'): boolean;
    hasHint(name: 'category'): boolean;
    hasHint(name: 'desktop-entry'): boolean;
    hasHint(name: 'image-data'): boolean;
    hasHint(name: 'image_data'): boolean;
    hasHint(name: 'image-path'): boolean;
    hasHint(name: 'image_path'): boolean;
    hasHint(name: 'resident'): boolean;
    hasHint(name: 'sound-file'): boolean;
    hasHint(name: 'sound-name'): boolean;
    hasHint(name: 'suppress-sound'): boolean;
    hasHint(name: 'transient'): boolean;
    hasHint(name: 'x', value: number): boolean;
    hasHint(name: 'y', value: number): boolean;
    hasHint(name: 'urgency', value: number): boolean;
    hasHint(name: string): boolean;
}

/**
 * Object that represents the notification
 */
export class Notification extends EventEmitter {

    private __owner: LinuxNotify;

    /**
     * Notification summary
     */
    public summary: string;
    /**
     * Notification body. https://specifications.freedesktop.org/notification-spec/latest/ar01s04.html
     */
    public body = '';
    /**
     * Notification image. https://specifications.freedesktop.org/notification-spec/latest/ar01s05.html
     */
    public imagePath: string;
    private _id: number;

    private __buttons: Button[] = [];
    private __hints: Hint[] = [];

    constructor(owner: LinuxNotify) {
        super();
        this.__owner = owner;
    }

    get isSended() {
        return !!this.__owner.getSended(this.id);
    }

    get id() {
        return this._id;
    }

    get buttons() {
        return [...this.__buttons];
    }

    get hints() {
        return [...this.__hints];
    }

    /**
     * Sends notification to the system
     * @param duration Duration in milliseconds (not required)
     */
    public send(duration?: number) {

        return new Promise<Notification>(async (resolve, reject) => {
            if (this.__owner.needInit) await this.__owner.init();

            if (this.__owner.desktopEntry && !this.hasHint('desktop-entry')) {
                this.setHint('desktop-entry', this.__owner.desktopEntry);
            }

            this.validate(duration);
            let app_name = this.__owner.program;
            let replaces_id = this._id || 0;
            let app_icon = this.imagePath || '';
            let summary = this.summary;
            let body = this.body;
            let actions = toDBusButtons(this.buttons);
            let hints = toDBusHints(this.hints);
            let expire_timeout = typeof (duration) === 'number' ? duration : this.__owner.duration;

            this.__owner.freedesktop.Notify(app_name, replaces_id, app_icon, summary, body, actions, hints, expire_timeout, (err, id) => {
                if (err) {
                    reject(err);
                    return;
                }

                const args = { id, notification: this };
                this.emit('sended', args);
                this.__owner.emit('sended', args);
                this._id = id;

                this.__owner.removeSended(id);
                (this.__owner as any).__list.push(this);

                resolve(this);
            });
        });
    }

    /**
     * If the notification is open, tells the system to close
     */
    public close() {
        return new Promise<void>((resolve, reject) => {
            this.__owner.freedesktop.CloseNotification(this.id, (errors) => {
                if (errors) {
                    reject(errors);
                    return;
                }

                resolve();
            });
        });
    }

    private validate(duration: number) {
        if (typeof (this.summary) !== 'string') throw new Error("The field 'summary' need string value!");
        if (typeof (this.body) !== 'string') throw new Error("The field 'body' need string value!");

        if (this.id && typeof (this.id) !== 'number') throw new Error("The field 'id' is number only!");
        if (duration && (typeof (duration) !== 'number' || duration < 0)) throw new Error("The field 'duration' is number only!");

        if (this.imagePath && typeof (this.imagePath) !== 'string') throw new Error("The field 'imagePath' need string value!");
    }

    ////Hints

    /**
     * Checks whether the hint has been set
     * @param name Hint
     */
    public hasHint(name: string) {
        return !!this.getHint(name);
    }

    /**
     * Defines a hint
     * @param name Hint
     * @param value Value
     * @param type HintType
     */
    public setHint(name: string, value: any, type?: HintType) {
        if (!name) throw new Error('Name cannot be empty!');

        const index = this.__hints.findIndex((hint) => hint.name === name);

        let hType = hintData[name] as HintType || type;
        if (!hType && typeof (value) === 'number') {
            hType = Number.isInteger(value) ? HintType.int : HintType.double;
        }

        if (!hType) throw new Error(`The "${type}" type is invalid!`);
        if (index < 0) {
            const hint = { name, value, type: hType };
            this.__hints.push(hint);
            return;
        }

        let hint = this.__hints[index];
        hint.value = value;

        this.__hints[index] = hint;

        return hint
    }

    /**
     * If set, remove the hint
     * @param name Hint
     */
    public removeHint(name: string) {
        const index = this.__hints.findIndex((hint) => hint.name === name);
        if (index < 0) return false;

        this.__hints.splice(index);

        return true;
    }

    /**
     * If set, returns the hint
     * @param name Hint
     */
    public getHint(name: string) {
        return this.__hints.find((hint) => hint.name === name) || null;
    }

    /**
     * Checks whether the button exists
     * @param id Button Id
     */
    public hasButton(id: string) {
        return !!this.getButton(id);
    }

    /**
     * Adds a button to the notification
     * @param id Button id
     * @param text Button text
     */
    public addButton(id: string, text: string) {
        if (this.buttons.find(button => button.id === id)) {
            throw new Error(`A button with id "${id}" has already been defined`);
        }
        const button = { id, text };

        this.__buttons.push(button);

        return button;
    }

    /**
     * If present, remove the button
     * @param id Button id
     */
    public removeButton(id: string) {
        const index = this.__buttons.findIndex((value) => value.id === id);
        if (index < 0) return false;

        this.__buttons.splice(index);

        return true;
    }

    /**
     * Returns the button
     * @param id Button Id
     */
    public getButton(id: string) {
        return this.__buttons.find((value) => value.id === id) || null;
    }
}

function toDBusButtons(buttons: Button[]) {
    if (!Array.isArray(buttons)) return [];

    return buttons.reduce((allButtons, button) => {
        const { id, text } = button;
        if (typeof (id) !== 'string' || typeof (text) !== 'string') throw new Error("Invalid button!");

        allButtons.push(id, text);
        return allButtons;
    }, []);
}

function toDBusHints(hints: Hint[]) {
    if (!Array.isArray(hints)) return [];

    return hints.map((hint) => {
        return [hint.name, [hint.type, hint.value]];
    });
}