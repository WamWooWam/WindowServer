import * as zip from '@zip.js/zip.js'

import { Buffer as B, FileSystem, Path } from "./extern/filer.js"

(async () => {
    const fs = await new Promise((res, rej) => {
        const fs = new FileSystem({ flags: ['FORMAT'] }, () => res(fs));
    }) as typeof import('node:fs');
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

    const zipFile = await fetch('/install.zip')
    const zipBlob = await zipFile.blob()
    const zipReader = new zip.ZipReader(new zip.BlobReader(zipBlob))
    const entries = await zipReader.getEntries()

    const textArea = document.createElement('textarea')
    textArea.style.width = '100%'
    textArea.style.height = '100%'
    document.body.appendChild(textArea)

    const root = '/';
    for (const entry of entries) {
        if (!entry) continue;

        const entryPath = entry.filename.toLowerCase().split('/')
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
            const file = path.join(root, entryDir, entryName)
            const blob = await entry.getData!(new zip.BlobWriter())
            const buffer = await blob.arrayBuffer()

            textArea.value += `Writing file ${file}\n`
            await writeFile(file, B.from(buffer))
        }
    }

    textArea.value += 'Done!\n'

    // textArea.value += 'Launching ntoskrnl.exe\n'
    // fs.readFile('/windows/system32/ntoskrnl.js', (err, data) => {
    //     if (err) {
    //         textArea.value += `Error: ${err}\n`
    //         return
    //     }
    //     else {
    //         textArea.remove();
    //     }

    //     const blob = new Blob([data], { type: 'text/javascript' })
    //     const url = URL.createObjectURL(blob)
    //     const script = document.createElement('script')
    //     script.src = url
    //     document.body.appendChild(script)
    // })

    const url = "/ntldr.js"
    const script = document.createElement('script')
    script.setAttribute('type', 'module')
    script.src = url
    document.body.appendChild(script)

})();