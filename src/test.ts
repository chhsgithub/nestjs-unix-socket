import * as fs from 'fs/promises';
import * as path from 'path';

async function getSize(dirPath: string): Promise<number> {
    const stats = await fs.stat(dirPath);
    if (stats.isFile()) {
        return stats.size;
    }
    const dir = await fs.readdir(dirPath);

    const sizes = await Promise.all(dir.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
            return stats.size;
        } else if (stats.isDirectory()) {
            return getSize(filePath);
        } else {
            return 0;
        }
    }));

    return sizes.reduce((a, b) => a + b, 0);
}

const pathToCheck = 'c:/Users/chen/workspace/nest-test/src/test.ts'


let t = Date.now()
getSize(pathToCheck).then(size => {
    console.log(Date.now() - t)
    console.log(`The total size of ${pathToCheck} is ${size} bytes.`);
    console.log(`The total size of ${pathToCheck} is ${(size / 1024 / 1024).toFixed(3)} MB.`);
}).catch(err => {
    console.error(err);
});