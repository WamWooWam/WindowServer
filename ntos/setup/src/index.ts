import * as asar from 'asar'

import { Buffer as B, FileSystem, Path } from "filer"

import { Decoder } from '@msgpack/msgpack'

// import * as zip from '@zip.js/zip.js'



(async () => {
    const fs = new FileSystem({ flags: ['FORMAT'] });
    const path = Path

    const exists = (path: string) => new Promise((res, rej) => {
        fs.exists(path, (exists) => {
            res(exists)
        })
    })

    const mkdir = (path: string) => new Promise<void>((res, rej) => {
        fs.mkdir(path, (err) => {
            err ? rej(err) : res()
        })
    })

    const writeFile = (path: string, data: Buffer) => new Promise<void>((res, rej) => {
        fs.writeFile(path, data, (err) => {
            err ? rej(err) : res()
        })
    });

    const asarFile = await fetch('/install.wim')
    const asarBlob = await asarFile.blob()
    const entries = await asar.extractAll(asarBlob, { flat: true }) as any;

    const textArea = document.createElement('textarea')
    textArea.style.width = '100%'
    textArea.style.height = '100%'
    document.body.appendChild(textArea)

    const root = '/';
    for (const [entry, data] of Object.entries(entries)) {
        if (!entry) continue;

        const entryPath = entry.toLowerCase().split('/')
        const entryName = entryPath[entryPath.length - 1]
        const entryDir = entryPath.slice(0, entryPath.length - 1).join('/')

        if (entryDir) {
            const dir = path.join(root, entryDir)
            if (!await exists(dir)) {
                textArea.value += `Creating directory ${dir}\n`
                await mkdir(dir)
            }
        }

        if (entryName) {
            const file = path.join(root, entryDir, entryName);
            textArea.value += `Writing file ${file}\n`
            await writeFile(file, B.from(data as ArrayBuffer))
        }
    }


    textArea.value += 'Done!\n'

    textArea.value += 'ldr:ntoskrnl.exe\n'

    // load ntoskrnl.exe 
    fs.readFile('/windows/system32/ntoskrnl.exe', async (err, data) => {
        if (err) throw err;

        const decoder = new Decoder();

        // exes are ASAR archives, so we need to extract it
        // we can't use the asar module because it's not compatible with the browser
        // so we have to do it manually
        let headerData = await asar.extractFile(data, '.header');
        textArea.value += `headerData: len:0x${headerData.byteLength.toString(16)}\n`

        let header = decoder.decode(headerData) as { file: string, entryPoint: string };
        textArea.value += `header: ${header.file}, ${header.entryPoint}\n`

        let entryPoint = await asar.extractFile(data, `.text/${header.file}`);
        textArea.value += `entryPoint: len:0x${entryPoint.byteLength.toString(16)}\n`

        // execute the entry point
        let url = URL.createObjectURL(new Blob([entryPoint], { type: 'text/javascript' }));
        let def = await import(url);

        if (def[header.entryPoint])
            await def[header.entryPoint]();
    });


    textArea.remove();
})();