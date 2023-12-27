// server that sets headers required for sharedarraybuffer

import express, { static as s } from 'express';

const app = express();
const port = 8000;

app.use((req, res, next) => {
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

app.use(s('dist'));

app.listen(port, () => console.log(`Listening on port ${port}!`));
