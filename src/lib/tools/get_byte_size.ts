export function getByteSize (value: string): number {

    if (value.includes("kb")) {
        value = value.replace("kb", "");
        return parseInt(value)*1024;
    }

    if (value.includes("mb")) {
        value = value.replace("mb", "");
        return parseInt(value)*1024*1024;
    }

    if (value.includes("b")) {
        value = value.replace("b", "");
        return parseInt(value);
    }

    return 0;

}