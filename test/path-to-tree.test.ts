import pathToTree, { Node } from '../src/utils/path-to-tree'

// const paths = [
//     "/var/www/html/index.html",
//     "/home/directory/again/app.js",
//     "/home/documents/readme.md",
//   ];


// const data = pathToTree(paths);
// console.log(data)

describe('pathToTree function', () => {  
    test('一个path', () => {
        let paths = ['/home/1.txt'];
        const data:Node[] = pathToTree(paths);
        expect(data.length).toBeGreaterThan(0);
        expect(data.length).toBe(1);
        expect(data[0].children.length).toBeGreaterThan(0);
        expect(data[0].children.length).toBe(1);
        expect(data[0].children[0].name).toBe('1.txt');
        expect(data[0].children[0].type).toBe('txt');
        expect(data[0].name).toBe('home');
        expect(data[0].type).toBe('folder');
    });

    test('两个path', () => {
        let paths = ['/home/1.txt', '/home/2.txt'];
        const data:Node[] = pathToTree(paths);
        expect(data.length).toBeGreaterThan(0);
        expect(data.length).toBe(1);
        expect(data[0].children.length).toBeGreaterThan(0);
        expect(data[0].children.length).toBe(2);
        expect(data[0].children[0].name).toBe('1.txt');
        expect(data[0].children[0].type).toBe('txt');
        expect(data[0].children[1].name).toBe('2.txt');
        expect(data[0].children[1].type).toBe('txt');
        expect(data[0].name).toBe('home');
        expect(data[0].type).toBe('folder');
    })

    test('三个path', () => {
        let paths = ['/home/1.txt', '/home/2.txt', '/home/home/1.txt'];
        const data:Node[] = pathToTree(paths);
        expect(data.length).toBeGreaterThan(0);
        expect(data.length).toBe(1);
        expect(data[0].children.length).toBeGreaterThan(0);
        expect(data[0].children.length).toBe(3);
        expect(data[0].children[0].name).toBe('1.txt');
        expect(data[0].children[0].type).toBe('txt');
        expect(data[0].children[1].name).toBe('2.txt');
        expect(data[0].children[1].type).toBe('txt');
        expect(data[0].children[2].name).toBe('home');
        expect(data[0].children[2].type).toBe('folder');
        expect(data[0].name).toBe('home');
        expect(data[0].type).toBe('folder');
    })
});
