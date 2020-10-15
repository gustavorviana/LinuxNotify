import { HintType } from "./HintType";

export interface Hint {
    type: HintType;
    name: string;
    value: any;
}