import * as asar from 'asar';

import { Buffer, FileSystem, Path } from 'filer';

import { Decoder } from '@msgpack/msgpack'

const fs = new FileSystem();
const path = Path;

const decoder = new Decoder();

// load ntoskrnl.exe 
fs.readFile('/windows/system32/ntoskrnl.exe', async (err, data) => {
    if (err) throw err;

    // exes are ASAR archives, so we need to extract it
    // we can't use the asar module because it's not compatible with the browser
    // so we have to do it manually
    let headerData = await asar.extractFile(data, '.header');
    console.log(headerData);

    let header = decoder.decode(headerData) as { file: string, entryPoint: string };
    console.log(header);

    let entryPoint = await asar.extractFile(data, `.text/${header.file}`);
    console.log(entryPoint);

    // execute the entry point
    let url = URL.createObjectURL(new Blob([entryPoint], { type: 'text/javascript' }));
    let def = await import(url);

    if (def[header.entryPoint])
        await def[header.entryPoint]();
});