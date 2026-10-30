import 'dotenv/config'
import { createApp } from './app.js';


function bootstrap () {
    const app = createApp();
    const port = process.env.PORT;

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        
    })
}

bootstrap();