let index = 10000;
function makeid() {
    index += 1;
    return index
}

export interface Node {
    name: string;
    id: Number | string;
    children: Node[];
    type: string;
}

export default function (data: string[]) {
    let output:Node[] = [];
    let current:Node[];

    for (const path of data) {
        current = output;

        for (const segment of path.split("/")) {
            if (segment !== "") {
                let type: string;
                let name: string;
                let id = makeid();
                if (segment.includes(".")) {
                    type = segment.substring(segment.indexOf(".") + 1);
                    name = segment;
                } else {
                    name = segment;
                    type = "folder";
                }
                let node:Node = { name, type, id, children: []};
                let found = current.find(child => child.name === name);
                if (!found) {
                    current.push(node);
                    found = node;
                }
                current = found.children;
            }
        }
    }

    return output;
};

export interface FileInfoNode {
    name: string;
    id: Number | string;
    children: FileInfoNode[];
    type: string;
    size: number;
    time: Date;
}

export function fileInfoToTree(data: FileInfoNode[]) {
    let output:FileInfoNode[] = [];
    let current:FileInfoNode[];

    for (const item of data) {
        current = output;

        const arr = item.name.split(/\/|\\/);
        const len = arr.length;
        arr.forEach((segment , idx) => {
            if (segment !== "") {
                let type: string;
                let name: string;
                let id = makeid();
                if (idx === len - 1) {
                    type = segment.substring(segment.lastIndexOf(".") + 1);
                    if (type === segment) {
                        type = ''
                    }
                    name = segment;
                } else {
                    name = segment;
                    type = "folder";
                }
                let node:FileInfoNode = { name, type, id, children: [], size: item.size, time: item.time};
                let found = current.find(child => child.name === name);
                if (!found) {
                    current.push(node);
                    found = node;
                }
                current = found.children;
            }
        })
    }

    return output;
}