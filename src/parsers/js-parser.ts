import Parser from "./parser";

export default class JSParser extends Parser {
    prettierOptions() : Record<string, any> {
        return { parser: "babel" };
    }
}
